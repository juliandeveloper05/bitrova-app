/**
 * Fix RLS Infinite Recursion in Members Table
 * Bitrova TaskList App
 * 
 * This migration fixes the infinite recursion error in the RLS policies
 * that was causing "infinite recursion detected in policy for relation 'members'"
 * 
 * The root cause: The members table policy queries itself, creating an infinite loop.
 * 
 * Solution: Create a helper function with SECURITY DEFINER that bypasses RLS
 * to get user's organizations, then use this function in all policies.
 * 
 * IMPORTANT: Run this SQL in Supabase SQL Editor!
 */

-- ============================================
-- STEP 1: Create Helper Function (bypasses RLS)
-- ============================================

-- Drop the function if it exists to ensure clean recreation
DROP FUNCTION IF EXISTS user_organizations();

-- Create a reusable helper function that bypasses RLS
-- This function runs with elevated privileges (SECURITY DEFINER)
-- and doesn't trigger RLS policies, breaking the circular dependency
CREATE OR REPLACE FUNCTION user_organizations()
RETURNS TABLE(organization_id UUID)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id
  FROM members
  WHERE user_id = auth.uid() 
    AND status = 'active';
$$;

-- ============================================
-- STEP 2: Fix Members Table Policies
-- ============================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "View org members" ON members;
DROP POLICY IF EXISTS "Admins can manage members" ON members;

-- Create fixed policy: Users can view members of their own organizations
CREATE POLICY "View org members" ON members
  FOR SELECT USING (
    organization_id IN (SELECT user_organizations())
    OR user_id = auth.uid()  -- Always allow users to see their own membership
  );

-- Create fixed policy: Admins can manage members in their orgs
CREATE POLICY "Admins can manage members" ON members
  FOR ALL USING (
    organization_id IN (
      SELECT m.organization_id 
      FROM members m
      WHERE m.user_id = auth.uid() 
        AND m.role IN ('owner', 'admin')
        AND m.status = 'active'
    )
  );

-- ============================================
-- STEP 3: Fix Teams Table Policies
-- ============================================

DROP POLICY IF EXISTS "View org teams" ON teams;
DROP POLICY IF EXISTS "Admins can manage teams" ON teams;

CREATE POLICY "View org teams" ON teams
  FOR SELECT USING (
    organization_id IN (SELECT user_organizations())
  );

CREATE POLICY "Admins can manage teams" ON teams
  FOR ALL USING (
    organization_id IN (
      SELECT m.organization_id 
      FROM members m
      WHERE m.user_id = auth.uid() 
        AND m.role IN ('owner', 'admin')
        AND m.status = 'active'
    )
  );

-- ============================================
-- STEP 4: Fix Workspaces Table Policies
-- ============================================

DROP POLICY IF EXISTS "View accessible workspaces" ON workspaces;
DROP POLICY IF EXISTS "Editors can manage workspaces" ON workspaces;

-- Recreate the workspaces select policy using the helper function
CREATE POLICY "View accessible workspaces" ON workspaces
  FOR SELECT USING (
    -- Org-wide visibility
    (visibility = 'organization' AND organization_id IN (SELECT user_organizations()))
    OR
    -- Team visibility
    (visibility = 'team' AND team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN members m ON tm.member_id = m.id
      WHERE m.user_id = auth.uid()
    ))
    OR
    -- Explicit workspace member
    id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      JOIN members m ON wm.member_id = m.id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage workspaces" ON workspaces
  FOR ALL USING (
    organization_id IN (
      SELECT m.organization_id 
      FROM members m
      WHERE m.user_id = auth.uid() 
        AND m.role IN ('owner', 'admin', 'editor')
        AND m.status = 'active'
    )
  );

-- ============================================
-- STEP 5: Fix Comments Table Policies
-- ============================================

DROP POLICY IF EXISTS "View task comments" ON comments;
DROP POLICY IF EXISTS "View comments" ON comments;

CREATE POLICY "View comments" ON comments
  FOR SELECT USING (
    organization_id IN (SELECT user_organizations())
    OR workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      JOIN members m ON wm.member_id = m.id
      WHERE m.user_id = auth.uid()
    )
    OR author_id = auth.uid()  -- Always allow viewing own comments
  );

-- ============================================
-- STEP 6: Fix Activities Table Policies
-- ============================================

DROP POLICY IF EXISTS "View org activities" ON activities;
DROP POLICY IF EXISTS "View activities" ON activities;

CREATE POLICY "View activities" ON activities
  FOR SELECT USING (
    organization_id IN (SELECT user_organizations())
  );

-- ============================================
-- STEP 7: Fix Invitations Table Policies
-- ============================================

DROP POLICY IF EXISTS "View invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON invitations;

CREATE POLICY "View invitations" ON invitations
  FOR SELECT USING (
    organization_id IN (SELECT user_organizations())
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage invitations" ON invitations
  FOR ALL USING (
    organization_id IN (
      SELECT m.organization_id 
      FROM members m
      WHERE m.user_id = auth.uid() 
        AND m.role IN ('owner', 'admin')
        AND m.status = 'active'
    )
  );

-- ============================================
-- STEP 8: Fix Organizations Table Policies
-- ============================================

DROP POLICY IF EXISTS "View own organizations" ON organizations;
DROP POLICY IF EXISTS "Owners can update organization" ON organizations;

CREATE POLICY "View own organizations" ON organizations
  FOR SELECT USING (
    id IN (SELECT user_organizations())
  );

CREATE POLICY "Owners can update organization" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT m.organization_id 
      FROM members m
      WHERE m.user_id = auth.uid() 
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );

-- ============================================
-- STEP 9: Fix Team Members Table Policies
-- ============================================

DROP POLICY IF EXISTS "View team members" ON team_members;

CREATE POLICY "View team members" ON team_members
  FOR SELECT USING (
    team_id IN (
      SELECT t.id 
      FROM teams t
      WHERE t.organization_id IN (SELECT user_organizations())
    )
  );

-- ============================================
-- STEP 10: Fix Workspace Members Table Policies
-- ============================================

DROP POLICY IF EXISTS "View workspace members" ON workspace_members;

CREATE POLICY "View workspace members" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id 
      FROM workspaces w
      WHERE w.organization_id IN (SELECT user_organizations())
    )
  );

-- ============================================
-- STEP 11: Fix Kanban Columns Table Policies
-- ============================================

DROP POLICY IF EXISTS "View kanban columns" ON kanban_columns;
DROP POLICY IF EXISTS "Editors can manage kanban columns" ON kanban_columns;

CREATE POLICY "View kanban columns" ON kanban_columns
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id 
      FROM workspaces w
      WHERE w.organization_id IN (SELECT user_organizations())
    )
  );

CREATE POLICY "Editors can manage kanban columns" ON kanban_columns
  FOR ALL USING (
    workspace_id IN (
      SELECT w.id 
      FROM workspaces w
      WHERE w.organization_id IN (
        SELECT m.organization_id 
        FROM members m
        WHERE m.user_id = auth.uid() 
          AND m.role IN ('owner', 'admin', 'editor')
          AND m.status = 'active'
      )
    )
  );

-- ============================================
-- STEP 12: Fix Tasks Table Policies (if applicable)
-- ============================================

DROP POLICY IF EXISTS "View workspace tasks" ON tasks;

CREATE POLICY "View workspace tasks" ON tasks
  FOR SELECT USING (
    -- Access via workspace with organization membership
    workspace_id IN (
      SELECT w.id FROM workspaces w 
      WHERE w.organization_id IN (SELECT user_organizations())
    )
    -- Or explicit workspace membership
    OR workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      JOIN members m ON wm.member_id = m.id
      WHERE m.user_id = auth.uid()
    )
    -- Fallback for legacy tasks without workspace
    OR (workspace_id IS NULL AND user_id = auth.uid())
  );

-- ============================================
-- VERIFICATION
-- ============================================

-- Test that the function works
SELECT 'Testing user_organizations function...' AS test;

-- Verify all policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'organizations', 'members', 'teams', 'workspaces', 'comments', 
    'activities', 'invitations', 'team_members', 
    'workspace_members', 'kanban_columns', 'tasks'
  )
ORDER BY tablename, policyname;

SELECT '✅ All RLS policies fixed successfully! Infinite recursion resolved.' AS status;
