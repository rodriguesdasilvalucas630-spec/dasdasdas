import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { ErrorHandler } from '@/utils/errorHandler';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Auth helper functions
export const signUp = async (email: string, password: string, userData: any) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    ErrorHandler.handle(error as Error, 'signUp');
    throw error;
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    ErrorHandler.handle(error as Error, 'signIn');
    throw error;
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    ErrorHandler.handle(error as Error, 'signOut');
    throw error;
  }
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getCurrentProfile = async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
    
  if (error) throw error;
  return data;
};

// Database helper functions
export const createResearch = async (researchData: any) => {
  const { data, error } = await supabase
    .from('researches')
    .insert(researchData)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const getActiveResearches = async () => {
  const { data, error } = await supabase
    .from('researches')
    .select(`
      *,
      research_regions(*),
      profiles(full_name)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};

export const getResearcherAssignments = async (researcherId: string) => {
  const { data, error } = await supabase
    .from('researcher_assignments')
    .select(`
      *,
      researches(name, status),
      research_regions(name, coordinates)
    `)
    .eq('researcher_id', researcherId)
    .eq('is_active', true);
    
  if (error) throw error;
  return data;
};

export const submitInterview = async (interviewData: any) => {
  const { data, error } = await supabase
    .from('interviews')
    .insert(interviewData)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};