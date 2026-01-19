/**
 * Supabase Configuration
 * TaskList App - Phase 2 Cloud Backup
 * 
 * Configuration for Supabase client and environment setup
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Supabase credentials from environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && 
         SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
};

// Custom storage adapter for React Native using AsyncStorage
const customStorage = {
  getItem: async (key) => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  },
  removeItem: async (key) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  },
};

// Create Supabase client with proper web configuration
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce', // Important for web security
    ...(Platform.OS === 'web' && {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    }),
  },
});

// Database table names
export const TABLES = {
  PROFILES: 'profiles',
  TASKS: 'tasks',
  BACKUPS: 'backups',
  SYNC_QUEUE: 'sync_queue',
  // Phase 3 B2B tables
  ORGANIZATIONS: 'organizations',
  TEAMS: 'teams',
  MEMBERS: 'members',
  TEAM_MEMBERS: 'team_members',
  WORKSPACES: 'workspaces',
  WORKSPACE_MEMBERS: 'workspace_members',
  KANBAN_COLUMNS: 'kanban_columns',
  INVITATIONS: 'invitations',
  COMMENTS: 'comments',
  ACTIVITIES: 'activities',
  NOTIFICATIONS: 'notifications',
};

// Storage bucket names
export const BUCKETS = {
  ATTACHMENTS: 'attachments',
  BACKUPS: 'backups',
};

// Sync configuration
export const SYNC_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  BATCH_SIZE: 50,
  CONFLICT_RESOLUTION: 'server_wins', // 'server_wins' | 'client_wins' | 'merge'
  AUTO_SYNC_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
};

// Backup configuration
export const BACKUP_CONFIG = {
  MAX_BACKUPS: 5,
  AUTO_BACKUP_ENABLED: true,
  BACKUP_INTERVAL_HOURS: 24,
};

/**
 * Get Supabase setup instructions
 */
export const getSetupInstructions = () => {
  return `
📋 Supabase Setup Instructions:

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to Settings > API and copy:
   - Project URL
   - anon/public key
4. Replace the placeholder values in config/supabase.js:
   - SUPABASE_URL = 'your-project-url'
   - SUPABASE_ANON_KEY = 'your-anon-key'

5. In Supabase Dashboard, go to Authentication > URL Configuration
   Add your web app URL to "Redirect URLs":
   - For development: http://localhost:19006
   - For production: your-domain.com

6. Run the following SQL in Supabase SQL Editor to create tables:

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  subscription_tier TEXT DEFAULT 'free'
);

-- Tasks table
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'personal',
  priority TEXT DEFAULT 'medium',
  completed BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMP WITH TIME ZONE,
  enable_reminder BOOLEAN DEFAULT FALSE,
  subtasks JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_series_id TEXT,
  instance_date TEXT,
  skipped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE,
  version INTEGER DEFAULT 1,
  deleted BOOLEAN DEFAULT FALSE
);

-- Backups table
CREATE TABLE backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  task_count INTEGER,
  file_size INTEGER,
  storage_path TEXT,
  is_automatic BOOLEAN DEFAULT TRUE,
  version TEXT DEFAULT '2.0'
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for tasks
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for backups
CREATE POLICY "Users can manage own backups" ON backups
  FOR ALL USING (auth.uid() = user_id);

-- Create profile automatically on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
`;
};

/**
 * Initialize auth state listener for web
 */
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  // Handle OAuth redirects
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      console.log('User signed in:', session?.user?.email);
    }
    if (event === 'SIGNED_OUT') {
      console.log('User signed out');
    }
  });
}

export default supabase;