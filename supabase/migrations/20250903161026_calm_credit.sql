/*
  # Fix Authentication and Database Functions

  1. Database Functions
    - Add missing `is_admin` function for RLS policies
    - Add `update_updated_at_column` trigger function
    - Add `auto_calculate_sample_size` function
    - Add `update_interview_counts` function
    - Add `handle_new_user` function for user creation

  2. Security
    - Fix RLS policies that reference missing functions
    - Ensure proper user creation flow
    - Add missing indexes for performance

  3. Authentication
    - Set up proper user creation trigger
    - Configure profile creation on signup
*/

-- Create missing database functions
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = is_admin.user_id 
    AND profiles.role = 'admin'
  );
END;
$$;

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to auto-calculate sample size
CREATE OR REPLACE FUNCTION auto_calculate_sample_size()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  n_value numeric;
  z_value numeric;
  p_value numeric;
  e_value numeric;
  pop_value numeric;
BEGIN
  -- Only calculate if not already set
  IF NEW.calculated_sample_size IS NULL THEN
    -- Set default values
    z_value := CASE 
      WHEN NEW.confidence_level = 90 THEN 1.645
      WHEN NEW.confidence_level = 95 THEN 1.96
      WHEN NEW.confidence_level = 99 THEN 2.576
      ELSE 1.96
    END;
    
    p_value := COALESCE(NEW.expected_proportion, 0.5);
    e_value := NEW.margin_error / 100.0;
    pop_value := COALESCE(NEW.population, 100000);
    
    -- Calculate sample size using standard formula
    n_value := (POWER(z_value, 2) * p_value * (1 - p_value)) / POWER(e_value, 2);
    
    -- Adjust for finite population
    IF pop_value > 0 THEN
      n_value := n_value / (1 + ((n_value - 1) / pop_value));
    END IF;
    
    NEW.calculated_sample_size := CEIL(n_value);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to update interview counts
CREATE OR REPLACE FUNCTION update_interview_counts()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update region completed interviews count
  IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    UPDATE research_regions 
    SET completed_interviews = completed_interviews + 1
    WHERE id = NEW.region_id;
    
    -- Update researcher assignment count
    UPDATE researcher_assignments 
    SET completed_interviews = completed_interviews + 1
    WHERE research_id = NEW.research_id 
    AND researcher_id = NEW.researcher_id 
    AND region_id = NEW.region_id;
    
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'completed' THEN
    UPDATE research_regions 
    SET completed_interviews = GREATEST(0, completed_interviews - 1)
    WHERE id = OLD.region_id;
    
    UPDATE researcher_assignments 
    SET completed_interviews = GREATEST(0, completed_interviews - 1)
    WHERE research_id = OLD.research_id 
    AND researcher_id = OLD.researcher_id 
    AND region_id = OLD.region_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
      UPDATE research_regions 
      SET completed_interviews = completed_interviews + 1
      WHERE id = NEW.region_id;
      
      UPDATE researcher_assignments 
      SET completed_interviews = completed_interviews + 1
      WHERE research_id = NEW.research_id 
      AND researcher_id = NEW.researcher_id 
      AND region_id = NEW.region_id;
      
    ELSIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
      UPDATE research_regions 
      SET completed_interviews = GREATEST(0, completed_interviews - 1)
      WHERE id = NEW.region_id;
      
      UPDATE researcher_assignments 
      SET completed_interviews = GREATEST(0, completed_interviews - 1)
      WHERE research_id = NEW.research_id 
      AND researcher_id = NEW.researcher_id 
      AND region_id = NEW.region_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (
    user_id,
    email,
    full_name,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'researcher')
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_research_region ON interviews(research_id, region_id);
CREATE INDEX IF NOT EXISTS idx_interviews_researcher_status ON interviews(researcher_id, status);

-- Update RLS policies to use correct function names
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage templates" ON research_templates;
CREATE POLICY "Admins can manage templates"
  ON research_templates
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all researches" ON researches;
CREATE POLICY "Admins can manage all researches"
  ON researches
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage regions" ON research_regions;
CREATE POLICY "Admins can manage regions"
  ON research_regions
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage assignments" ON researcher_assignments;
CREATE POLICY "Admins can manage assignments"
  ON researcher_assignments
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;
CREATE POLICY "Admins can manage user roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all interviews" ON interviews;
CREATE POLICY "Admins can view all interviews"
  ON interviews
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage reports" ON reports;
CREATE POLICY "Admins can manage reports"
  ON reports
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view activity logs" ON activity_logs;
CREATE POLICY "Admins can view activity logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));