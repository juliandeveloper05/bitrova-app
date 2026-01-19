/**
 * Activity Service
 * Bitrova TaskList App - Phase 3 B2B
 * 
 * Logs and retrieves team activity for activity feed
 */

import { supabase, TABLES } from '../config/supabase';

// ============================================
// ACTIVITY TYPES
// ============================================

export const ActivityAction = {
  // Tasks
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_COMPLETED: 'task.completed',
  TASK_DELETED: 'task.deleted',
  TASK_ASSIGNED: 'task.assigned',
  TASK_MOVED: 'task.moved',
  
  // Comments
  COMMENT_ADDED: 'comment.added',
  COMMENT_UPDATED: 'comment.updated',
  COMMENT_DELETED: 'comment.deleted',
  
  // Workspace
  WORKSPACE_CREATED: 'workspace.created',
  WORKSPACE_UPDATED: 'workspace.updated',
  WORKSPACE_DELETED: 'workspace.deleted',
  
  // Members
  MEMBER_JOINED: 'member.joined',
  MEMBER_LEFT: 'member.left',
  MEMBER_ROLE_CHANGED: 'member.role_changed',
  
  // Organization
  ORG_SETTINGS_UPDATED: 'org.settings_updated',
};

// ============================================
// LOG ACTIVITY
// ============================================

/**
 * Log an activity event
 * @param {Object} params
 * @param {string} params.organizationId
 * @param {string} params.workspaceId - Optional
 * @param {string} params.actorId - User who performed action
 * @param {string} params.action - From ActivityAction enum
 * @param {string} params.targetType - 'task', 'comment', 'workspace', 'member'
 * @param {string} params.targetId
 * @param {Object} params.metadata - Additional context
 */
export async function logActivity({
  organizationId,
  workspaceId,
  actorId,
  action,
  targetType,
  targetId,
  metadata = {},
}) {
  try {
    const { error } = await supabase
      .from(TABLES.ACTIVITIES)
      .insert({
        organization_id: organizationId,
        workspace_id: workspaceId,
        actor_id: actorId,
        action,
        target_type: targetType,
        target_id: targetId,
        metadata,
      });

    if (error) {
      console.error('Failed to log activity:', error);
    }
  } catch (err) {
    console.error('Activity logging error:', err);
  }
}

// ============================================
// GET ACTIVITIES
// ============================================

/**
 * Get activity feed for a workspace
 * @param {string} workspaceId 
 * @param {Object} options - { limit, offset, actions }
 */
export async function getWorkspaceActivities(workspaceId, options = {}) {
  const { limit = 50, offset = 0, actions } = options;

  let query = supabase
    .from(TABLES.ACTIVITIES)
    .select(`
      id,
      action,
      target_type,
      target_id,
      metadata,
      created_at,
      actor:profiles!actor_id (
        id,
        display_name,
        email,
        avatar_url
      )
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (actions && actions.length > 0) {
    query = query.in('action', actions);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get activity feed for an organization
 * @param {string} organizationId 
 * @param {Object} options - { limit, offset, actions, workspaceId }
 */
export async function getOrganizationActivities(organizationId, options = {}) {
  const { limit = 50, offset = 0, actions, workspaceId } = options;

  let query = supabase
    .from(TABLES.ACTIVITIES)
    .select(`
      id,
      action,
      target_type,
      target_id,
      metadata,
      created_at,
      workspace:workspaces (
        id,
        name
      ),
      actor:profiles!actor_id (
        id,
        display_name,
        email,
        avatar_url
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }

  if (actions && actions.length > 0) {
    query = query.in('action', actions);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get user's recent activity
 * @param {string} userId 
 * @param {number} limit 
 */
export async function getUserActivities(userId, limit = 20) {
  const { data, error } = await supabase
    .from(TABLES.ACTIVITIES)
    .select(`
      id,
      action,
      target_type,
      target_id,
      metadata,
      created_at,
      workspace:workspaces (
        id,
        name
      )
    `)
    .eq('actor_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ============================================
// ACTIVITY FORMATTING
// ============================================

/**
 * Format activity for display
 * @param {Object} activity 
 * @returns {Object} { icon, message, color }
 */
export function formatActivity(activity) {
  const { action, metadata = {}, actor } = activity;
  const actorName = actor?.display_name || actor?.email?.split('@')[0] || 'Someone';

  const formats = {
    [ActivityAction.TASK_CREATED]: {
      icon: '✨',
      message: `${actorName} created "${metadata.taskTitle || 'a task'}"`,
      color: '#22c55e',
    },
    [ActivityAction.TASK_COMPLETED]: {
      icon: '✅',
      message: `${actorName} completed "${metadata.taskTitle || 'a task'}"`,
      color: '#10b981',
    },
    [ActivityAction.TASK_DELETED]: {
      icon: '🗑️',
      message: `${actorName} deleted "${metadata.taskTitle || 'a task'}"`,
      color: '#ef4444',
    },
    [ActivityAction.TASK_ASSIGNED]: {
      icon: '👤',
      message: `${actorName} assigned "${metadata.taskTitle}" to ${metadata.assigneeName}`,
      color: '#3b82f6',
    },
    [ActivityAction.TASK_MOVED]: {
      icon: '📦',
      message: `${actorName} moved "${metadata.taskTitle}" to ${metadata.toColumn}`,
      color: '#8b5cf6',
    },
    [ActivityAction.COMMENT_ADDED]: {
      icon: '💬',
      message: `${actorName} commented on "${metadata.taskTitle}"`,
      color: '#6366f1',
    },
    [ActivityAction.MEMBER_JOINED]: {
      icon: '👋',
      message: `${metadata.memberName || actorName} joined the team`,
      color: '#22c55e',
    },
    [ActivityAction.MEMBER_LEFT]: {
      icon: '👋',
      message: `${metadata.memberName || 'A member'} left the team`,
      color: '#f59e0b',
    },
    [ActivityAction.WORKSPACE_CREATED]: {
      icon: '📁',
      message: `${actorName} created workspace "${metadata.workspaceName}"`,
      color: '#3b82f6',
    },
  };

  return formats[action] || {
    icon: '📝',
    message: `${actorName} performed action: ${action}`,
    color: '#6b7280',
  };
}

/**
 * Group activities by date
 * @param {Array} activities 
 * @returns {Object} { today: [], yesterday: [], thisWeek: [], older: [] }
 */
export function groupActivitiesByDate(activities) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const startOfWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);

  const groups = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  activities.forEach(activity => {
    const date = new Date(activity.created_at);
    
    if (date >= startOfToday) {
      groups.today.push(activity);
    } else if (date >= startOfYesterday) {
      groups.yesterday.push(activity);
    } else if (date >= startOfWeek) {
      groups.thisWeek.push(activity);
    } else {
      groups.older.push(activity);
    }
  });

  return groups;
}

export default {
  ActivityAction,
  logActivity,
  getActivities,
  getWorkspaceActivities,
  getOrganizationActivities,
  getUserActivities,
  formatActivity,
  groupActivitiesByDate,
};

/**
 * Simple getActivities that works without profile JOINs
 */
export async function getActivities({ organizationId, workspaceId, limit = 50 }) {
  let query = supabase
    .from(TABLES.ACTIVITIES)
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }

  const { data, error } = await query;

  if (error) throw error;
  
  // Map to format expected by ActivityFeed
  return (data || []).map(activity => ({
    ...activity,
    type: activity.action?.replace('.', '_') || 'default',
  }));
}
