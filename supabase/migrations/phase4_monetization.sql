-- ============================================
-- Phase 4: Monetization & Analytics
-- Supabase Database Migrations
-- TaskList App (Bitrova)
-- ============================================

-- Run this in your Supabase SQL Editor
-- Dashboard > SQL Editor > New Query

-- ============================================
-- 1. CREATE ENUMS FOR STRICT TYPING
-- ============================================

DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'unpaid', 'none');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. CREATE PLAN_LIMITS TABLE
-- ============================================
-- This allows dynamic quota adjustments without redeploying app code

CREATE TABLE IF NOT EXISTS plan_limits (
  tier subscription_tier PRIMARY KEY,
  max_tasks_per_month INTEGER,
  max_storage_mb INTEGER,
  features JSONB -- Store flags like {"ai_enabled": true}
);

-- Insert tier definitions (idempotent with ON CONFLICT)
INSERT INTO plan_limits (tier, max_tasks_per_month, max_storage_mb, features) VALUES
  ('free', 25, 100, '{"ai_access": false, "smart_dates": false, "cloud_sync": false}'),
  ('pro', 10000, 10000, '{"ai_access": true, "smart_dates": true, "cloud_sync": true}'),
  ('enterprise', -1, -1, '{"ai_access": true, "smart_dates": true, "cloud_sync": true, "team_workspaces": true}')
ON CONFLICT (tier) DO UPDATE SET
  max_tasks_per_month = EXCLUDED.max_tasks_per_month,
  max_storage_mb = EXCLUDED.max_storage_mb,
  features = EXCLUDED.features;

-- Enable public read access to limits
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access to plan limits" ON plan_limits;
CREATE POLICY "Public read access to plan limits" ON plan_limits FOR SELECT USING (true);

-- ============================================
-- 3. UPDATE PROFILES TABLE
-- ============================================
-- Add subscription and usage tracking columns

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tier subscription_tier DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS sub_status subscription_status DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS revenue_cat_id TEXT,
  ADD COLUMN IF NOT EXISTS is_legacy BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tasks_usage_current INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS storage_usage_bytes BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cycle_start_date TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS weekly_report_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS weekly_report_day INTEGER DEFAULT 1; -- 1 = Monday

-- ============================================
-- 4. CREATE USAGE CHECK FUNCTION
-- ============================================
-- Secure function to check if user can create a task

CREATE OR REPLACE FUNCTION check_usage_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier subscription_tier;
  user_is_legacy BOOLEAN;
  current_usage INTEGER;
  limit_count INTEGER;
BEGIN
  -- Get user tier and usage
  SELECT tier, is_legacy, tasks_usage_current 
  INTO user_tier, user_is_legacy, current_usage
  FROM profiles WHERE id = user_uuid;
  
  -- Legacy users have unlimited access
  IF user_is_legacy THEN RETURN TRUE; END IF;
  
  -- Get limit for that tier
  SELECT max_tasks_per_month INTO limit_count
  FROM plan_limits WHERE tier = user_tier;

  -- If limit is -1 (unlimited), return true
  IF limit_count = -1 THEN RETURN TRUE; END IF;
  
  RETURN current_usage < limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. TASK CREATION TRIGGER (AUTO-INCREMENT)
-- ============================================
-- Automatically increment usage when task is created

CREATE OR REPLACE FUNCTION increment_task_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET tasks_usage_current = tasks_usage_current + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (drop first if exists for idempotency)
DROP TRIGGER IF EXISTS on_task_created ON tasks;
CREATE TRIGGER on_task_created
AFTER INSERT ON tasks
FOR EACH ROW EXECUTE FUNCTION increment_task_count();

-- ============================================
-- 6. MONTHLY RESET FUNCTION
-- ============================================
-- Call this from a scheduled cron job

CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET 
    tasks_usage_current = 0,
    cycle_start_date = NOW()
  WHERE cycle_start_date < NOW() - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. CREATE AI_LOGS TABLE (OPTIONAL)
-- ============================================
-- Track AI usage for analytics and debugging

CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  model TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for ai_logs
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own ai_logs" ON ai_logs;
CREATE POLICY "Users can view own ai_logs" ON ai_logs FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 8. GRANDFATHERING SCRIPT
-- ============================================
-- Run this ONCE to mark existing users as Legacy

-- UPDATE profiles SET is_legacy = TRUE WHERE created_at < NOW();
-- Uncomment and run the above line manually after deploying migrations

-- ============================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(tier);
CREATE INDEX IF NOT EXISTS idx_profiles_sub_status ON profiles(sub_status);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_created ON ai_logs(user_id, created_at DESC);

-- ============================================
-- DONE! Run this in your Supabase SQL Editor.
-- ============================================
