/**
 * RBAC Service - Role-Based Access Control
 * Bitrova TaskList App - Phase 3 B2B
 * 
 * Handles permission checking for multi-tenant access control
 */

import { supabase, TABLES } from '../config/supabase';

// ============================================
// PERMISSION DEFINITIONS
// ============================================

export const Permission = {
  // Organization level
  ORG_MANAGE_BILLING: 'org:manage_billing',
  ORG_MANAGE_MEMBERS: 'org:manage_members',
  ORG_MANAGE_TEAMS: 'org:manage_teams',
  ORG_MANAGE_SETTINGS: 'org:manage_settings',
  ORG_VIEW_ANALYTICS: 'org:view_analytics',
  
  // Team level
  TEAM_CREATE: 'team:create',
  TEAM_DELETE: 'team:delete',
  TEAM_MANAGE_MEMBERS: 'team:manage_members',
  
  // Workspace level
  WORKSPACE_CREATE: 'workspace:create',
  WORKSPACE_DELETE: 'workspace:delete',
  WORKSPACE_EDIT: 'workspace:edit',
  WORKSPACE_VIEW: 'workspace:view',
  WORKSPACE_MANAGE_MEMBERS: 'workspace:manage_members',
  
  // Task level
  TASK_CREATE: 'task:create',
  TASK_EDIT_ALL: 'task:edit_all',
  TASK_EDIT_ASSIGNED: 'task:edit_assigned',
  TASK_DELETE: 'task:delete',
  TASK_COMMENT: 'task:comment',
  TASK_ASSIGN: 'task:assign',
};

// ============================================
// ROLE DEFINITIONS
// ============================================

export const ROLES = {
  owner: {
    name: 'owner',
    label: 'Owner',
    description: 'Full access to organization',
    permissions: Object.values(Permission),
  },
  admin: {
    name: 'admin',
    label: 'Admin',
    description: 'Manage members and settings',
    permissions: [
      Permission.ORG_MANAGE_MEMBERS,
      Permission.ORG_MANAGE_TEAMS,
      Permission.ORG_VIEW_ANALYTICS,
      Permission.TEAM_CREATE,
      Permission.TEAM_DELETE,
      Permission.TEAM_MANAGE_MEMBERS,
      Permission.WORKSPACE_CREATE,
      Permission.WORKSPACE_DELETE,
      Permission.WORKSPACE_EDIT,
      Permission.WORKSPACE_VIEW,
      Permission.WORKSPACE_MANAGE_MEMBERS,
      Permission.TASK_CREATE,
      Permission.TASK_EDIT_ALL,
      Permission.TASK_DELETE,
      Permission.TASK_COMMENT,
      Permission.TASK_ASSIGN,
    ],
  },
  editor: {
    name: 'editor',
    label: 'Editor',
    description: 'Create and edit tasks',
    permissions: [
      Permission.WORKSPACE_VIEW,
      Permission.WORKSPACE_EDIT,
      Permission.TASK_CREATE,
      Permission.TASK_EDIT_ASSIGNED,
      Permission.TASK_COMMENT,
      Permission.TASK_ASSIGN,
    ],
  },
  viewer: {
    name: 'viewer',
    label: 'Viewer',
    description: 'View-only access',
    permissions: [
      Permission.WORKSPACE_VIEW,
      Permission.TASK_COMMENT,
    ],
  },
  guest: {
    name: 'guest',
    label: 'Guest',
    description: 'Limited access to shared items',
    permissions: [
      Permission.WORKSPACE_VIEW,
    ],
  },
};

// ============================================
// MEMBERSHIP CACHE
// ============================================

let membershipCache = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Clear the membership cache (call on logout or org switch)
 */
export function clearRBACCache() {
  membershipCache = null;
  cacheExpiry = 0;
}

/**
 * Get current user's membership info
 * @returns {Promise<Object|null>} Membership with role
 */
async function getCurrentMembership(organizationId) {
  // Check cache
  if (membershipCache && Date.now() < cacheExpiry && membershipCache.organizationId === organizationId) {
    return membershipCache;
  }
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data: member, error } = await supabase
      .from(TABLES.MEMBERS)
      .select('*')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single();
    
    if (error || !member) return null;
    
    // Update cache
    membershipCache = { ...member, organizationId };
    cacheExpiry = Date.now() + CACHE_TTL;
    
    return member;
  } catch (error) {
    console.error('Error fetching membership:', error);
    return null;
  }
}

// ============================================
// PERMISSION CHECKING
// ============================================

/**
 * Check if user has a specific permission
 * @param {string} permission - Permission to check
 * @param {Object} context - Context with organizationId, workspaceId, taskId
 * @returns {Promise<boolean>}
 */
export async function hasPermission(permission, context = {}) {
  const { organizationId, workspaceId, taskId } = context;
  
  if (!organizationId) {
    console.warn('hasPermission called without organizationId');
    return false;
  }
  
  const member = await getCurrentMembership(organizationId);
  if (!member) return false;
  
  const role = ROLES[member.role];
  if (!role) return false;
  
  // Check role permissions
  if (role.permissions.includes(permission)) {
    return true;
  }
  
  // Check custom permissions (overrides)
  if (Array.isArray(member.permissions) && member.permissions.includes(permission)) {
    return true;
  }
  
  // Special case: TASK_EDIT_ASSIGNED allows editing if user is assigned
  if (permission === Permission.TASK_EDIT_ALL && taskId) {
    const canEditAssigned = role.permissions.includes(Permission.TASK_EDIT_ASSIGNED);
    if (canEditAssigned) {
      return await isTaskAssignedToUser(taskId);
    }
  }
  
  return false;
}

/**
 * Check if current user is assigned to a task
 */
async function isTaskAssignedToUser(taskId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data: task } = await supabase
      .from(TABLES.TASKS)
      .select('assigned_to, user_id')
      .eq('id', taskId)
      .single();
    
    if (!task) return false;
    
    // Check if user created the task or is in assigned_to array
    return task.user_id === user.id || 
           (Array.isArray(task.assigned_to) && task.assigned_to.includes(user.id));
  } catch {
    return false;
  }
}

/**
 * Require permission or throw error
 * @throws {Error} If permission denied
 */
export async function requirePermission(permission, context = {}) {
  const allowed = await hasPermission(permission, context);
  if (!allowed) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

/**
 * Get role by name
 * @param {string} roleName 
 * @returns {Object|null}
 */
export function getRole(roleName) {
  return ROLES[roleName] || null;
}

/**
 * Check if role A can manage role B
 * @param {string} managerRole - Role of the person trying to manage
 * @param {string} targetRole - Role of the person being managed
 * @returns {boolean}
 */
export function canManageRole(managerRole, targetRole) {
  const hierarchy = ['guest', 'viewer', 'editor', 'admin', 'owner'];
  const managerLevel = hierarchy.indexOf(managerRole);
  const targetLevel = hierarchy.indexOf(targetRole);
  
  // Can only manage roles below your own level
  return managerLevel > targetLevel;
}

/**
 * Get assignable roles based on current user's role
 * @param {string} currentRole - Current user's role
 * @returns {Array} List of roles that can be assigned
 */
export function getAssignableRoles(currentRole) {
  const hierarchy = ['guest', 'viewer', 'editor', 'admin', 'owner'];
  const currentLevel = hierarchy.indexOf(currentRole);
  
  return Object.values(ROLES)
    .filter(role => {
      const roleLevel = hierarchy.indexOf(role.name);
      return roleLevel < currentLevel; // Can only assign lower roles
    })
    .map(role => ({
      value: role.name,
      label: role.label,
      description: role.description,
    }));
}

// ============================================
// WORKSPACE-SPECIFIC PERMISSIONS
// ============================================

/**
 * Check workspace-level permission
 * @param {string} permission 
 * @param {string} workspaceId 
 * @param {string} organizationId 
 */
export async function hasWorkspacePermission(permission, workspaceId, organizationId) {
  // First check org-level permission
  const orgLevel = await hasPermission(permission, { organizationId });
  if (orgLevel) return true;
  
  // Check workspace-specific role
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data: member } = await supabase
      .from(TABLES.MEMBERS)
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();
    
    if (!member) return false;
    
    const { data: workspaceMember } = await supabase
      .from(TABLES.WORKSPACE_MEMBERS)
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('member_id', member.id)
      .single();
    
    if (!workspaceMember) return false;
    
    // Workspace roles are simpler: admin, editor, viewer
    const wsRole = ROLES[workspaceMember.role];
    return wsRole && wsRole.permissions.includes(permission);
  } catch {
    return false;
  }
}

export default {
  Permission,
  ROLES,
  hasPermission,
  requirePermission,
  hasWorkspacePermission,
  getRole,
  canManageRole,
  getAssignableRoles,
  clearRBACCache,
};
