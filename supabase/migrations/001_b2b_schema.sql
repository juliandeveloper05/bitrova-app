/**
 * Phase 3 B2B Database Schema Migration
 * Bitrova TaskList App
 * 
 * Run this SQL in Supabase SQL Editor in order
 * 
 * IMPORTANT: Backup your data before running this migration!
 */

-- ============================================
-- PART 1: ORGANIZATIONS & TEAMS
-- ============================================

-- Organizations (top-level tenant)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'team', 'business', 'enterprise')),
  subscription_status VARCHAR(50) DEFAULT 'trial' CHECK (subscription_status IN ('active', 'trial', 'suspended', 'cancelled')),
  max_members INT DEFAULT 3,
  max_workspaces INT DEFAULT 2,
  settings JSONB DEFAULT '{
    "defaultRole": "editor",
    "allowGuestInvites": false,
    "retentionDays": 90
  }',
  stripe_customer_id TEXT,
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams within organizations
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  visibility VARCHAR(50) DEFAULT 'organization' CHECK (visibility IN ('private', 'organization')),
  color VARCHAR(7) DEFAULT '#3b82f6',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members (users in organizations with roles)
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(50) DEFAULT 'editor' CHECK (role IN ('owner', 'admin', 'editor', 'viewer', 'guest')),
  permissions JSONB DEFAULT '[]',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'invited' CHECK (status IN ('active', 'invited', 'suspended')),
  UNIQUE(user_id, organization_id)
);

-- Team memberships (many-to-many)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('lead', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, member_id)
);

-- ============================================
-- PART 2: WORKSPACES
-- ============================================

-- Workspaces (task containers)
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'list' CHECK (type IN ('list', 'kanban', 'calendar', 'timeline')),
  visibility VARCHAR(50) DEFAULT 'team' CHECK (visibility IN ('private', 'team', 'organization')),
  settings JSONB DEFAULT '{
    "allowComments": true,
    "allowFileAttachments": true,
    "defaultView": "list"
  }',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace members (explicit access)
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(50) DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, member_id)
);

-- Kanban columns for workspace boards
CREATE TABLE IF NOT EXISTS kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) DEFAULT '#94a3b8',
  position INT DEFAULT 0,
  wip_limit INT,
  collapsed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 3: EXTEND TASKS TABLE
-- ============================================

-- Add B2B columns to existing tasks table
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS kanban_column_id UUID REFERENCES kanban_columns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS kanban_position INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assigned_to UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS collaborators UUID[] DEFAULT '{}';

-- ============================================
-- PART 4: INVITATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer', 'guest')),
  token TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 5: COMMENTS & ACTIVITY
-- ============================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  mentions JSONB DEFAULT '[]',
  reactions JSONB DEFAULT '[]',
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 6: INDEXES
-- ============================================

-- Organizations & Teams
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_plan ON organizations(plan) WHERE subscription_status = 'active';
CREATE INDEX IF NOT EXISTS idx_teams_org ON teams(organization_id);

-- Members & Access
CREATE INDEX IF NOT EXISTS idx_members_user_org ON members(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_members_org_status ON members(organization_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);

-- Tasks (multi-tenant)
CREATE INDEX IF NOT EXISTS idx_tasks_org_workspace ON tasks(organization_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_column ON tasks(workspace_id, kanban_column_id, kanban_position);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks USING GIN(assigned_to);

-- Invitations
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations(organization_id, status);

-- Activity & Notifications
CREATE INDEX IF NOT EXISTS idx_activities_org_created ON activities(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_workspace ON activities(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, read, created_at DESC);

-- ============================================
-- PART 7: ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can view orgs they're members of
CREATE POLICY "View own organizations" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Owners can update organization" ON organizations
  FOR UPDATE USING (
    id IN (SELECT organization_id FROM members WHERE user_id = auth.uid() AND role = 'owner')
  );

-- Members: Can view members in same org
CREATE POLICY "View org members" ON members
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Admins can manage members" ON members
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Teams: Visible to org members
CREATE POLICY "View org teams" ON teams
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Admins can manage teams" ON teams
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Workspaces: Visible based on visibility + membership
CREATE POLICY "View accessible workspaces" ON workspaces
  FOR SELECT USING (
    -- Org-wide visibility
    (visibility = 'organization' AND organization_id IN (
      SELECT organization_id FROM members WHERE user_id = auth.uid() AND status = 'active'
    ))
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

-- Tasks: Access via workspace
CREATE POLICY "View workspace tasks" ON tasks
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE 
        (visibility = 'organization' AND organization_id IN (
          SELECT organization_id FROM members WHERE user_id = auth.uid() AND status = 'active'
        ))
        OR id IN (
          SELECT wm.workspace_id FROM workspace_members wm
          JOIN members m ON wm.member_id = m.id
          WHERE m.user_id = auth.uid()
        )
    )
    -- Fallback for legacy tasks without workspace
    OR (workspace_id IS NULL AND user_id = auth.uid())
  );

-- Invitations: Visible to org admins or the invited email
CREATE POLICY "View invitations" ON invitations
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Comments: Visible to task accessors
CREATE POLICY "View task comments" ON comments
  FOR SELECT USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      JOIN members m ON wm.member_id = m.id
      WHERE m.user_id = auth.uid()
    )
    OR organization_id IN (
      SELECT organization_id FROM members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Activities: Visible to org members
CREATE POLICY "View org activities" ON activities
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid() AND status = 'active')
  );

-- Notifications: Only own
CREATE POLICY "View own notifications" ON notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Update own notifications" ON notifications
  FOR UPDATE USING (recipient_id = auth.uid());

-- ============================================
-- PART 8: HELPER FUNCTIONS
-- ============================================

-- Function to create personal organization on user signup
CREATE OR REPLACE FUNCTION create_personal_organization()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  new_workspace_id UUID;
  user_name TEXT;
  user_slug TEXT;
BEGIN
  -- Generate user name from email or metadata
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Generate unique slug
  user_slug := LOWER(REGEXP_REPLACE(user_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);
  
  -- Create personal organization
  INSERT INTO organizations (name, slug, max_members, max_workspaces)
  VALUES (user_name || '''s Workspace', user_slug, 3, 2)
  RETURNING id INTO new_org_id;
  
  -- Add user as owner
  INSERT INTO members (user_id, organization_id, role, status)
  VALUES (NEW.id, new_org_id, 'owner', 'active');
  
  -- Create default workspace
  INSERT INTO workspaces (organization_id, name, type, visibility, created_by)
  VALUES (new_org_id, 'My Tasks', 'list', 'private', NEW.id)
  RETURNING id INTO new_workspace_id;
  
  -- Migrate any existing tasks (if upgrading existing user)
  UPDATE tasks 
  SET organization_id = new_org_id, workspace_id = new_workspace_id
  WHERE user_id = NEW.id AND organization_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup (replace if exists)
DROP TRIGGER IF EXISTS on_auth_user_created_b2b ON auth.users;
CREATE TRIGGER on_auth_user_created_b2b
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_personal_organization();

-- Function to get user's current organization context
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id 
  FROM members 
  WHERE user_id = auth.uid() AND status = 'active'
  ORDER BY joined_at ASC
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- PART 9: DEFAULT DATA FOR KANBAN
-- ============================================

-- Function to create default Kanban columns for a workspace
CREATE OR REPLACE FUNCTION create_default_kanban_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'kanban' THEN
    INSERT INTO kanban_columns (workspace_id, name, color, position) VALUES
      (NEW.id, 'Backlog', '#94a3b8', 0),
      (NEW.id, 'To Do', '#3b82f6', 1),
      (NEW.id, 'In Progress', '#f59e0b', 2),
      (NEW.id, 'In Review', '#8b5cf6', 3),
      (NEW.id, 'Done', '#10b981', 4);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspace_kanban_columns
  AFTER INSERT ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION create_default_kanban_columns();

-- ============================================
-- MIGRATION COMPLETE MESSAGE
-- ============================================
-- Run SELECT 'Phase 3 B2B Schema Migration Complete!' AS status;
