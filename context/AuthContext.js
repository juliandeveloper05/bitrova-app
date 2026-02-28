/**
 * Auth Context
 * TaskList App - Phase 2 Cloud Backup
 * 
 * Handles user authentication with Supabase
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '../config/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  // Check Supabase configuration on mount
  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [isConfigured]);

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(async (email, password, displayName = '') => {
    if (!isConfigured) {
      throw new Error('Supabase no está configurado');
    }

    try {
      setLoading(true);
      console.log('Attempting sign up...', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        console.error('Supabase Auth Error (SignUp):', error.message, error.status);
        throw error;
      }
      
      console.log('Sign up success:', data);
      return { success: true, user: data.user };
      
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('Network failure — likely no connectivity to Supabase:', error);
      } else {
        console.error('Unexpected Sign Up error:', error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isConfigured]);

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email, password) => {
    if (!isConfigured) {
      throw new Error('Supabase no está configurado');
    }

    try {
      setLoading(true);
      console.log('Attempting sign in...', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase Auth Error (SignIn):', error.message, error.status);
        throw error;
      }

      console.log('Sign in success:', data);
      return { success: true, user: data.user };
      
    } catch (error) {
       if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('Network failure — likely no connectivity to Supabase:', error);
      } else {
        console.error('Unexpected Sign In error:', error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isConfigured]);

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reset password
   */
  const resetPassword = useCallback(async (email) => {
    if (!isConfigured) {
      throw new Error('Supabase no está configurado');
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: Platform.OS === 'web' 
          ? window.location.origin + '/reset-password'
          : undefined,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }, [isConfigured]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates) => {
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }, [user]);

  /**
   * Get user display name
   */
  const getDisplayName = useCallback(() => {
    if (!user) return 'Usuario';
    return user.user_metadata?.display_name || 
           user.email?.split('@')[0] || 
           'Usuario';
  }, [user]);

  const value = {
    user,
    session,
    loading,
    isConfigured,
    isAuthenticated: !!session,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    getDisplayName,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
