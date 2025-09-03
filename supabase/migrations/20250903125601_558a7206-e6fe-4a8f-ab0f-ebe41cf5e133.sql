-- ============================================================================
-- SECURITY FIXES - Vote Scout Pro
-- Corrigindo problemas detectados pelo linter de segurança
-- ============================================================================

-- Fix 1: Add missing RLS policies for user_roles table
CREATE POLICY "Admins can manage user roles" ON public.user_roles
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Fix 2: Set search_path for all functions to prevent security issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.calculate_sample_size(
    population INTEGER,
    margin_error DECIMAL,
    confidence_level INTEGER,
    proportion DECIMAL DEFAULT 0.5
)
RETURNS INTEGER AS $$
DECLARE
    z_score DECIMAL;
    n DECIMAL;
BEGIN
    -- Get Z-score based on confidence level
    z_score := CASE confidence_level
        WHEN 90 THEN 1.645
        WHEN 95 THEN 1.96
        WHEN 99 THEN 2.576
        ELSE 1.96
    END;
    
    -- Calculate sample size
    n := (z_score * z_score * proportion * (1 - proportion)) / (margin_error / 100.0 * margin_error / 100.0);
    
    -- Adjust for finite population
    IF population IS NOT NULL AND population > 0 THEN
        n := n / (1 + (n - 1) / population);
    END IF;
    
    RETURN CEIL(n);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.auto_calculate_sample_size()
RETURNS TRIGGER AS $$
BEGIN
    NEW.calculated_sample_size := public.calculate_sample_size(
        NEW.population,
        NEW.margin_error,
        NEW.confidence_level,
        NEW.expected_proportion
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_interview_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update region completed interviews count
    UPDATE public.research_regions 
    SET completed_interviews = (
        SELECT COUNT(*) 
        FROM public.interviews 
        WHERE region_id = COALESCE(NEW.region_id, OLD.region_id)
        AND status = 'completed'
    )
    WHERE id = COALESCE(NEW.region_id, OLD.region_id);
    
    -- Update researcher assignment completed interviews count
    UPDATE public.researcher_assignments 
    SET completed_interviews = (
        SELECT COUNT(*) 
        FROM public.interviews 
        WHERE region_id = COALESCE(NEW.region_id, OLD.region_id)
        AND researcher_id = COALESCE(NEW.researcher_id, OLD.researcher_id)
        AND status = 'completed'
    )
    WHERE region_id = COALESCE(NEW.region_id, OLD.region_id)
    AND researcher_id = COALESCE(NEW.researcher_id, OLD.researcher_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger for automatic profile creation when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, role)
    VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
        'researcher'::user_role
    );
    
    -- Create user role entry
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'researcher'::user_role);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();