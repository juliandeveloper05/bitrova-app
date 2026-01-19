/**
 * Fix for user registration trigger
 * Run this in Supabase SQL Editor
 * 
 * The original trigger was failing because RLS was blocking inserts.
 * This version adds INSERT policies and fixes the trigger permissions.
 */

-- ============================================
-- STEP 1: Add INSERT policies for organizations
-- ============================================

-- Allow users to insert their own organization (for the trigger)
CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (true);

-- Allow the trigger to insert members
CREATE POLICY "Trigger can create members" ON members
  FOR INSERT WITH CHECK (true);

-- Allow the trigger to insert workspaces  
CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (true);

-- Allow workspace columns creation
CREATE POLICY "Allow kanban column creation" ON kanban_columns
  FOR INSERT WITH CHECK (true);

-- ============================================
-- STEP 2: Fix the trigger function
-- ============================================

-- Drop and recreate with better error handling
CREATE OR REPLACE FUNCTION create_personal_organization()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  new_workspace_id UUID;
  user_name TEXT;
  user_slug TEXT;
BEGIN
  -- Generate user name from email or metadata
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1),
    'User'
  );
  
  -- Generate unique slug
  user_slug := LOWER(REGEXP_REPLACE(COALESCE(user_name, 'user'), '[^a-zA-Z0-9]', '-', 'g')) 
               || '-' 
               || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);
  
  -- Create personal organization
  INSERT INTO public.organizations (name, slug, max_members, max_workspaces)
  VALUES (user_name || '''s Workspace', user_slug, 3, 2)
  RETURNING id INTO new_org_id;
  
  -- Add user as owner
  INSERT INTO public.members (user_id, organization_id, role, status)
  VALUES (NEW.id, new_org_id, 'owner', 'active');
  
  -- Create default workspace
  INSERT INTO public.workspaces (organization_id, name, type, visibility, created_by)
  VALUES (new_org_id, 'My Tasks', 'list', 'private', NEW.id)
  RETURNING id INTO new_workspace_id;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create personal organization for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 3: Recreate the trigger
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created_b2b ON auth.users;

CREATE TRIGGER on_auth_user_created_b2b
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_personal_organization();

-- ============================================
-- DONE!
-- ============================================
SELECT 'Trigger fix applied successfully!' AS status;
