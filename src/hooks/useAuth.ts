import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getCurrentProfile } from '@/lib/supabase';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            const userProfile = await getCurrentProfile();
            setProfile(userProfile);
          } catch (error) {
            console.error('Error getting profile:', error);
          }
        }
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            const userProfile = await getCurrentProfile();
            setProfile(userProfile);
          } catch (error) {
            console.error('Error getting profile after auth change:', error);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => {
    return profile?.role === 'admin';
  };

  const isResearcher = () => {
    return profile?.role === 'researcher';
  };

  return {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isResearcher,
    isAuthenticated: !!user
  };
};