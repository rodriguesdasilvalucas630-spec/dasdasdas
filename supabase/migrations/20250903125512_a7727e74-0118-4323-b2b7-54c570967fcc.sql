-- ============================================================================
-- VOTE SCOUT PRO - COMPLETE DATABASE SCHEMA
-- Sistema completo de pesquisas eleitorais
-- ============================================================================

-- Create custom types
CREATE TYPE public.user_role AS ENUM ('admin', 'researcher');
CREATE TYPE public.research_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');
CREATE TYPE public.interview_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');
CREATE TYPE public.region_status AS ENUM ('pending', 'active', 'completed');
CREATE TYPE public.question_type AS ENUM ('radio', 'textarea', 'select', 'demographic', 'scale');

-- ============================================================================
-- USER MANAGEMENT
-- ============================================================================

-- Profiles table for additional user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'researcher',
    avatar_url TEXT,
    phone TEXT,
    document_number TEXT, -- CPF or similar
    address JSONB, -- Full address object
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE,
    efficiency_score DECIMAL(3,2) DEFAULT 0.80, -- 0.00 to 1.00
    total_interviews_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User roles table for fine-grained permissions
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, role)
);

-- ============================================================================
-- RESEARCH MANAGEMENT
-- ============================================================================

-- Research templates
CREATE TABLE public.research_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'electoral', 'evaluation', 'demographic'
    questions JSONB NOT NULL DEFAULT '[]',
    estimated_duration INTEGER, -- minutes
    target_audience TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Main research projects
CREATE TABLE public.researches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status research_status DEFAULT 'draft',
    template_id UUID REFERENCES public.research_templates(id),
    
    -- Geographic data
    city TEXT NOT NULL,
    state TEXT,
    country TEXT DEFAULT 'Brasil',
    population INTEGER,
    
    -- Statistical parameters
    margin_error DECIMAL(3,1) NOT NULL, -- e.g., 3.5
    confidence_level INTEGER NOT NULL, -- e.g., 95
    expected_proportion DECIMAL(3,2) DEFAULT 0.50,
    calculated_sample_size INTEGER,
    
    -- Timeline
    start_date DATE,
    end_date DATE,
    deadline TIMESTAMP WITH TIME ZONE,
    
    -- Configuration
    questions JSONB NOT NULL DEFAULT '[]',
    regions JSONB DEFAULT '[]', -- Array of region objects
    randomize_options BOOLEAN DEFAULT true,
    require_gps BOOLEAN DEFAULT true,
    allow_offline BOOLEAN DEFAULT true,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Research regions/districts
CREATE TABLE public.research_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_id UUID REFERENCES public.researches(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    status region_status DEFAULT 'pending',
    target_interviews INTEGER NOT NULL,
    completed_interviews INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 3, -- 1-5 scale
    difficulty INTEGER DEFAULT 3, -- 1-5 scale
    coordinates JSONB, -- {lat, lng}
    boundaries JSONB, -- Polygon coordinates if available
    demographic_targets JSONB, -- Age, gender quotas etc
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- INTERVIEW MANAGEMENT
-- ============================================================================

-- Individual interviews
CREATE TABLE public.interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_id UUID REFERENCES public.researches(id) ON DELETE CASCADE NOT NULL,
    region_id UUID REFERENCES public.research_regions(id),
    researcher_id UUID REFERENCES auth.users(id) NOT NULL,
    
    status interview_status DEFAULT 'pending',
    
    -- Location data
    gps_coordinates JSONB, -- {lat, lng, accuracy}
    location_verified BOOLEAN DEFAULT false,
    address TEXT,
    
    -- Interview data
    answers JSONB NOT NULL DEFAULT '{}',
    demographic_data JSONB NOT NULL DEFAULT '{}',
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    
    -- Quality control
    is_valid BOOLEAN DEFAULT true,
    validation_notes TEXT,
    quality_score DECIMAL(3,2),
    
    -- Sync data
    is_synced BOOLEAN DEFAULT false,
    device_info JSONB,
    app_version TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- ASSIGNMENTS & WORKLOAD
-- ============================================================================

-- Researcher assignments to regions
CREATE TABLE public.researcher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_id UUID REFERENCES public.researches(id) ON DELETE CASCADE NOT NULL,
    researcher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    region_id UUID REFERENCES public.research_regions(id) ON DELETE CASCADE NOT NULL,
    
    target_interviews INTEGER NOT NULL,
    completed_interviews INTEGER DEFAULT 0,
    
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Auto-distribution metadata
    confidence_score DECIMAL(3,2), -- AI confidence in assignment
    estimated_completion TIMESTAMP WITH TIME ZONE,
    
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(research_id, researcher_id, region_id)
);

-- ============================================================================
-- NOTIFICATIONS & ALERTS
-- ============================================================================

-- System notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    research_id UUID REFERENCES public.researches(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL, -- 'quota_alert', 'research_update', 'assignment', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority INTEGER DEFAULT 3, -- 1-5
    
    is_read BOOLEAN DEFAULT false,
    is_push_sent BOOLEAN DEFAULT false,
    is_email_sent BOOLEAN DEFAULT false,
    
    action_url TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- REPORTS & ANALYTICS
-- ============================================================================

-- Generated reports
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_id UUID REFERENCES public.researches(id) ON DELETE CASCADE NOT NULL,
    
    type TEXT NOT NULL, -- 'summary', 'detailed', 'demographic', 'geographic'
    title TEXT NOT NULL,
    description TEXT,
    
    -- Report data
    data JSONB NOT NULL DEFAULT '{}',
    charts JSONB DEFAULT '[]',
    filters JSONB DEFAULT '{}',
    
    -- File exports
    pdf_url TEXT,
    excel_url TEXT,
    csv_url TEXT,
    
    generated_by UUID REFERENCES auth.users(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Access control
    is_public BOOLEAN DEFAULT false,
    access_token TEXT UNIQUE DEFAULT gen_random_uuid()::text
);

-- ============================================================================
-- AUDIT & LOGGING
-- ============================================================================

-- Activity logs
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    research_id UUID REFERENCES public.researches(id),
    
    action TEXT NOT NULL,
    entity_type TEXT, -- 'research', 'interview', 'assignment', etc.
    entity_id UUID,
    
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('avatars', 'avatars', true),
    ('reports', 'reports', false),
    ('exports', 'exports', false),
    ('templates', 'templates', false);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.researches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.researcher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin');
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (public.is_admin(auth.uid()));

-- Research templates policies
CREATE POLICY "Everyone can view active templates" ON public.research_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage templates" ON public.research_templates
    FOR ALL USING (public.is_admin(auth.uid()));

-- Researches policies
CREATE POLICY "Admins can manage all researches" ON public.researches
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Researchers can view assigned researches" ON public.researches
    FOR SELECT USING (
        auth.uid() IN (
            SELECT researcher_id FROM public.researcher_assignments 
            WHERE research_id = public.researches.id
        )
    );

-- Research regions policies
CREATE POLICY "Admins can manage regions" ON public.research_regions
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Researchers can view assigned regions" ON public.research_regions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT researcher_id FROM public.researcher_assignments 
            WHERE region_id = public.research_regions.id
        )
    );

-- Interviews policies
CREATE POLICY "Researchers can manage own interviews" ON public.interviews
    FOR ALL USING (auth.uid() = researcher_id);

CREATE POLICY "Admins can view all interviews" ON public.interviews
    FOR SELECT USING (public.is_admin(auth.uid()));

-- Assignments policies
CREATE POLICY "Users can view own assignments" ON public.researcher_assignments
    FOR SELECT USING (auth.uid() = researcher_id);

CREATE POLICY "Admins can manage assignments" ON public.researcher_assignments
    FOR ALL USING (public.is_admin(auth.uid()));

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Reports policies
CREATE POLICY "Admins can manage reports" ON public.reports
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Public reports are viewable" ON public.reports
    FOR SELECT USING (is_public = true);

-- Activity logs policies
CREATE POLICY "Admins can view activity logs" ON public.activity_logs
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "System can insert logs" ON public.activity_logs
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Avatar storage policies
CREATE POLICY "Avatar images are publicly accessible" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
    ON storage.objects FOR UPDATE 
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Report storage policies
CREATE POLICY "Admins can manage reports storage" 
    ON storage.objects FOR ALL 
    USING (bucket_id = 'reports' AND public.is_admin(auth.uid()));

-- Export storage policies  
CREATE POLICY "Admins can manage exports storage" 
    ON storage.objects FOR ALL 
    USING (bucket_id = 'exports' AND public.is_admin(auth.uid()));

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_researches_updated_at BEFORE UPDATE ON public.researches
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_research_regions_updated_at BEFORE UPDATE ON public.research_regions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON public.interviews
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_research_templates_updated_at BEFORE UPDATE ON public.research_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate sample size
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
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate sample size when research is updated
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculate_sample_size_trigger BEFORE INSERT OR UPDATE ON public.researches
    FOR EACH ROW EXECUTE FUNCTION public.auto_calculate_sample_size();

-- Function to update interview counts
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_interview_counts_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON public.interviews
    FOR EACH ROW EXECUTE FUNCTION public.update_interview_counts();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default research templates
INSERT INTO public.research_templates (name, description, category, questions, estimated_duration, target_audience) VALUES
('Intenção de Voto Completa', 'Pesquisa completa de intenção de voto com estimulada e espontânea', 'electoral', '[
    {
        "id": "voting_intention_spontaneous",
        "type": "textarea",
        "text": "Se a eleição fosse hoje, em quem você votaria para prefeito? (Resposta espontânea)",
        "required": true,
        "order": 1
    },
    {
        "id": "voting_intention_stimulated", 
        "type": "radio",
        "text": "E se os candidatos fossem estes, em quem você votaria?",
        "options": ["Candidato A", "Candidato B", "Candidato C", "Voto nulo", "Voto em branco", "Não sabe"],
        "required": true,
        "randomizeOptions": true,
        "order": 2
    },
    {
        "id": "vote_certainty",
        "type": "radio", 
        "text": "Quão certo você está do seu voto?",
        "options": ["Totalmente certo", "Muito certo", "Pouco certo", "Pode mudar", "Não sabe"],
        "required": true,
        "order": 3
    }
]'::jsonb, 15, 'Eleitores aptos'),

('Avaliação de Gestão Municipal', 'Avaliação completa da gestão municipal atual', 'evaluation', '[
    {
        "id": "mayor_evaluation",
        "type": "radio",
        "text": "Como você avalia a gestão do atual prefeito?", 
        "options": ["Ótima", "Boa", "Regular", "Ruim", "Péssima", "Não sabe"],
        "required": true,
        "order": 1
    },
    {
        "id": "main_problems",
        "type": "radio",
        "text": "Qual o principal problema da cidade?",
        "options": ["Saúde", "Educação", "Segurança", "Transporte", "Emprego", "Saneamento"],
        "required": true,
        "randomizeOptions": true,
        "order": 2
    }
]'::jsonb, 20, 'População geral'),

('Perfil Demográfico Eleitoral', 'Levantamento demográfico detalhado do eleitorado', 'demographic', '[
    {
        "id": "voting_frequency",
        "type": "radio",
        "text": "Com que frequência você vota?",
        "options": ["Sempre", "Quase sempre", "Às vezes", "Raramente", "Nunca"],
        "required": true,
        "order": 1
    },
    {
        "id": "political_interest",
        "type": "scale",
        "text": "Qual seu nível de interesse em política?",
        "min": 1,
        "max": 5,
        "minLabel": "Nenhum interesse",
        "maxLabel": "Muito interesse",
        "required": true,
        "order": 2
    }
]'::jsonb, 25, 'Eleitores em geral');

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Research and interview performance indexes
CREATE INDEX idx_interviews_research_id ON public.interviews(research_id);
CREATE INDEX idx_interviews_researcher_id ON public.interviews(researcher_id);
CREATE INDEX idx_interviews_region_id ON public.interviews(region_id);
CREATE INDEX idx_interviews_status ON public.interviews(status);
CREATE INDEX idx_interviews_created_at ON public.interviews(created_at);
CREATE INDEX idx_interviews_gps ON public.interviews USING GIN(gps_coordinates);

CREATE INDEX idx_assignments_research_id ON public.researcher_assignments(research_id);
CREATE INDEX idx_assignments_researcher_id ON public.researcher_assignments(researcher_id);
CREATE INDEX idx_assignments_region_id ON public.researcher_assignments(region_id);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at);

-- GIN indexes for JSONB columns
CREATE INDEX idx_interviews_answers ON public.interviews USING GIN(answers);
CREATE INDEX idx_interviews_demographic ON public.interviews USING GIN(demographic_data);
CREATE INDEX idx_researches_questions ON public.researches USING GIN(questions);
CREATE INDEX idx_reports_data ON public.reports USING GIN(data);