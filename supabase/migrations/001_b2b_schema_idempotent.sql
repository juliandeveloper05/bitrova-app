/**
 * Phase 3 B2B Database Schema Migration - IDEMPOTENT VERSION
 * Bitrova TaskList App
 * 
 * This version can be run multiple times safely.
 * All policies are DROPped before CREATE.
 */

-- ============================================
-- PART 1: ORGANIZATIONS & TEAMS
-- ============================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'team', 'business', 'enterprise')),
  subscription_status VARCHAR(50) DEFAULT 'trial' CHECK (subscription_status IN ('active', 'trial', 'suspended', 'cancelled')),
  max_members INT DEFAULT 3,
  max_workspaces INT DEFAULT 2,
  settings JSONB DEFAULT '{"defaultRole": "editor", "allowGuestInvites": false, "retentionDays": 90}',
  stripe_customer_id TEXT,
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'list' CHECK (type IN ('list', 'kanban', 'calendar', 'timeline')),
  visibility VARCHAR(50) DEFAULT 'team' CHECK (visibility IN ('private', 'team', 'organization')),
  settings JSONB DEFAULT '{"allowComments": true, "allowFileAttachments": true, "defaultView": "list"}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(50) DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, member_id)
);

CREATE TABLE IF NOT EXISTS kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#6366f1',
  position INT NOT NULL DEFAULT 0,
  wip_limit INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 3: INVITATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer', 'guest')),
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 4: COMMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentions JSONB DEFAULT '[]',
  reactions JSONB DEFAULT '[]',
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 5: ACTIVITIES & NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  task_id UUID,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  type VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  action_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 6: INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_members_user_org ON members(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_members_org_status ON members(organization_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_activities_org_created ON activities(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kanban_columns_workspace ON kanban_columns(workspace_id, position);

-- ============================================
-- PART 7: ENABLE RLS
-- ============================================

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

-- ============================================
-- PART 8: POLICIES (DROP + CREATE for idempotency)
-- ============================================

-- Organizations
DROP POLICY IF EXISTS "View own organizations" ON organizations;
CREATE POLICY "View own organizations" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM members WHERE user_id = auth.uid() AND status = 'active')
  );

DROP POLICY IF EXISTS "Owners can update organization" ON organizations;
CREATE POLICY "Owners can update organization" ON organizations
  FOR UPDATE USING (
    id IN (SELECT organization_id FROM members WHERE user_id = auth.uid() AND role = 'owner')
  );

DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (true);

-- Teams
DROP POLICY IF EXISTS "View org teams" ON teams;
CREATE POLICY "View org teams" ON teams
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid() AND status = 'active')
  );

DROP POLICY IF EXISTS "Admins can manage teams" ON teams;
CREATE POLICY "Admins can manage teams" ON teams
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Members
DROP POLICY IF EXISTS "View org members" ON members;
CREATE POLICY "View org members" ON members
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid() AND status = 'active')
  );

DROP POLICY IF EXISTS "Admins can manage members" ON members;
CREATE POLICY "Admins can manage members" ON members
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

DROP POLICY IF EXISTS "Users can insert themselves as members" ON members;
CREATE POLICY "Users can insert themselves as members" ON members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Workspaces
DROP POLICY IF EXISTS "View workspaces" ON workspaces;
CREATE POLICY "View workspaces" ON workspaces
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid() AND status = 'active')
  );

DROP POLICY IF EXISTS "Editors can manage workspaces" ON workspaces;
CREATE POLICY "Editors can manage workspaces" ON workspaces
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
  );

DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid() AND status = 'active')
  );

-- Kanban Columns
DROP POLICY IF EXISTS "View kanban columns" ON kanban_columns;
CREATE POLICY "View kanban columns" ON kanban_columns
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM workspaces WHERE organization_id IN (
      SELECT organization_id FROM members WHERE user_id = auth.uid() AND status = 'active'
    ))
  );

DROP POLICY IF EXISTS "Editors can manage kanban columns" ON kanban_columns;
CREATE POLICY "Editors can manage kanban columns" ON kanban_columns
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE organization_id IN (
      SELECT organization_id FROM members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    ))
  );

DROP POLICY IF EXISTS "Users can create kanban columns" ON kanban_columns;
CREATE POLICY "Users can create kanban columns" ON kanban_columns
  FOR INSERT WITH CHECK (true);

-- Comments
DROP POLICY IF EXISTS "View comments" ON comments;
CREATE POLICY "View comments" ON comments
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid() AND status = 'active')
  );

DROP POLICY IF EXISTS "Create comments" ON comments;
CREATE POLICY "Create comments" ON comments
  FOR INSERT WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Manage own comments" ON comments;
CREATE POLICY "Manage own comments" ON comments
  FOR UPDATE USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Delete own comments" ON comments;
CREATE POLICY "Delete own comments" ON comments
  FOR DELETE USING (author_id = auth.uid());

-- Activities
DROP POLICY IF EXISTS "View activities" ON activities;
CREATE POLICY "View activities" ON activities
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid() AND status = 'active')
  );

DROP POLICY IF EXISTS "Create activities" ON activities;
CREATE POLICY "Create activities" ON activities
  FOR INSERT WITH CHECK (actor_id = auth.uid());

-- Notifications
DROP POLICY IF EXISTS "View own notifications" ON notifications;
CREATE POLICY "View own notifications" ON notifications
  FOR SELECT USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Update own notifications" ON notifications;
CREATE POLICY "Update own notifications" ON notifications
  FOR UPDATE USING (recipient_id = auth.uid());

-- Invitations
DROP POLICY IF EXISTS "View invitations" ON invitations;
CREATE POLICY "View invitations" ON invitations
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid() AND status = 'active')
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage invitations" ON invitations;
CREATE POLICY "Admins can manage invitations" ON invitations
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Team Members
DROP POLICY IF EXISTS "View team members" ON team_members;
CREATE POLICY "View team members" ON team_members
  FOR SELECT USING (
    team_id IN (SELECT id FROM teams WHERE organization_id IN (
      SELECT organization_id FROM members WHERE user_id = auth.uid() AND status = 'active'
    ))
  );

-- Workspace Members
DROP POLICY IF EXISTS "View workspace members" ON workspace_members;
CREATE POLICY "View workspace members" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM workspaces WHERE organization_id IN (
      SELECT organization_id FROM members WHERE user_id = auth.uid() AND status = 'active'
    ))
  );

-- ============================================
-- PART 9: HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION create_personal_organization()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id UUID;
  workspace_id UUID;
  member_id UUID;
BEGIN
  -- Create personal organization
  INSERT INTO organizations (name, slug, plan, subscription_status, max_members, max_workspaces)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)) || '''s Workspace',
    'personal-' || NEW.id,
    'free',
    'active',
    1,
    5
  )
  RETURNING id INTO org_id;
  
  -- Add user as owner
  INSERT INTO members (user_id, organization_id, role, status)
  VALUES (NEW.id, org_id, 'owner', 'active')
  RETURNING id INTO member_id;
  
  -- Create default workspace
  INSERT INTO workspaces (organization_id, name, type, visibility, created_by)
  VALUES (org_id, 'My Tasks', 'list', 'private', NEW.id)
  RETURNING id INTO workspace_id;
  
  -- Create default kanban columns
  INSERT INTO kanban_columns (workspace_id, name, position, color) VALUES
    (workspace_id, 'To Do', 0, '#6366f1'),
    (workspace_id, 'In Progress', 1, '#f59e0b'),
    (workspace_id, 'Done', 2, '#10b981');
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in create_personal_organization: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_personal_organization();

-- Default kanban columns function
CREATE OR REPLACE FUNCTION create_default_kanban_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'kanban' THEN
    INSERT INTO kanban_columns (workspace_id, name, position, color) VALUES
      (NEW.id, 'To Do', 0, '#6366f1'),
      (NEW.id, 'In Progress', 1, '#f59e0b'),
      (NEW.id, 'Review', 2, '#8b5cf6'),
      (NEW.id, 'Done', 3, '#10b981');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workspace_kanban_columns ON workspaces;
CREATE TRIGGER workspace_kanban_columns
  AFTER INSERT ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION create_default_kanban_columns();

-- ============================================
-- COMPLETE
-- ============================================
SELECT 'B2B Schema Migration Complete!' AS status;
