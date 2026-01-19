/**
 * Realtime Service - Supabase Realtime
 * Bitrova TaskList App - Phase 3 B2B
 * 
 * Handles real-time synchronization for collaborative editing
 */

import { supabase, TABLES } from '../config/supabase';

// ============================================
// CHANNEL MANAGEMENT
// ============================================

const activeChannels = new Map();

/**
 * Subscribe to workspace changes
 * @param {string} workspaceId 
 * @param {Object} callbacks - { onTaskChange, onPresenceSync, onTyping }
 * @returns {Function} Unsubscribe function
 */
export function subscribeToWorkspace(workspaceId, callbacks = {}) {
  const channelName = `workspace:${workspaceId}`;
  
  // Reuse existing channel
  if (activeChannels.has(channelName)) {
    console.log(`[Realtime] Reusing channel: ${channelName}`);
    return activeChannels.get(channelName).unsubscribe;
  }

  console.log(`[Realtime] Subscribing to: ${channelName}`);

  const channel = supabase
    .channel(channelName, {
      config: {
        broadcast: { self: false }, // Don't receive own broadcasts
        presence: { key: '' }, // Will be set on track()
      },
    })
    // Task changes (INSERT, UPDATE, DELETE)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.TASKS,
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => {
        console.log(`[Realtime] Task change:`, payload.eventType);
        callbacks.onTaskChange?.(payload);
      }
    )
    // Comment changes
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: TABLES.COMMENTS,
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => {
        console.log(`[Realtime] New comment`);
        callbacks.onCommentAdded?.(payload);
      }
    )
    // Presence sync (who's online)
    .on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      callbacks.onPresenceSync?.(presenceState);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      callbacks.onUserJoined?.(newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      callbacks.onUserLeft?.(leftPresences);
    })
    // Broadcast messages (typing indicators, cursor positions)
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
      callbacks.onTyping?.(payload);
    })
    .on('broadcast', { event: 'cursor' }, ({ payload }) => {
      callbacks.onCursorMove?.(payload);
    })
    .on('broadcast', { event: 'task_editing' }, ({ payload }) => {
      callbacks.onTaskEditing?.(payload);
    })
    .subscribe((status) => {
      console.log(`[Realtime] ${channelName} status:`, status);
    });

  const unsubscribe = () => {
    console.log(`[Realtime] Unsubscribing from: ${channelName}`);
    channel.unsubscribe();
    activeChannels.delete(channelName);
  };

  activeChannels.set(channelName, { channel, unsubscribe });

  return unsubscribe;
}

// ============================================
// PRESENCE
// ============================================

/**
 * Track user presence in a workspace
 * @param {string} workspaceId 
 * @param {Object} userInfo - { id, name, avatar, color }
 */
export async function trackPresence(workspaceId, userInfo) {
  const channelName = `workspace:${workspaceId}`;
  const channelData = activeChannels.get(channelName);
  
  if (!channelData) {
    console.warn(`[Realtime] Cannot track presence - no channel for ${workspaceId}`);
    return;
  }

  const presenceData = {
    user_id: userInfo.id,
    user_name: userInfo.name,
    avatar: userInfo.avatar,
    color: userInfo.color || generateUserColor(userInfo.id),
    online_at: new Date().toISOString(),
  };

  await channelData.channel.track(presenceData);
  console.log(`[Realtime] Tracking presence:`, presenceData.user_name);
}

/**
 * Get all users currently in a workspace
 * @param {string} workspaceId 
 * @returns {Array} List of present users
 */
export function getWorkspacePresence(workspaceId) {
  const channelName = `workspace:${workspaceId}`;
  const channelData = activeChannels.get(channelName);
  
  if (!channelData) return [];

  const presenceState = channelData.channel.presenceState();
  
  // Flatten presence state into array
  return Object.values(presenceState).flat();
}

// ============================================
// BROADCASTS
// ============================================

/**
 * Broadcast typing indicator
 * @param {string} workspaceId 
 * @param {string} taskId 
 * @param {boolean} isTyping 
 */
export async function broadcastTyping(workspaceId, taskId, isTyping) {
  const channelName = `workspace:${workspaceId}`;
  const channelData = activeChannels.get(channelName);
  
  if (!channelData) return;

  await channelData.channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { taskId, isTyping, timestamp: Date.now() },
  });
}

/**
 * Broadcast that user is editing a task
 * @param {string} workspaceId 
 * @param {string} taskId 
 * @param {string} field - Which field is being edited
 */
export async function broadcastTaskEditing(workspaceId, taskId, field = null) {
  const channelName = `workspace:${workspaceId}`;
  const channelData = activeChannels.get(channelName);
  
  if (!channelData) return;

  await channelData.channel.send({
    type: 'broadcast',
    event: 'task_editing',
    payload: { taskId, field, timestamp: Date.now() },
  });
}

/**
 * Broadcast cursor position (for collaborative editing)
 * @param {string} workspaceId 
 * @param {Object} position - { x, y, taskId }
 */
export async function broadcastCursor(workspaceId, position) {
  const channelName = `workspace:${workspaceId}`;
  const channelData = activeChannels.get(channelName);
  
  if (!channelData) return;

  await channelData.channel.send({
    type: 'broadcast',
    event: 'cursor',
    payload: { ...position, timestamp: Date.now() },
  });
}

// ============================================
// NOTIFICATIONS CHANNEL
// ============================================

/**
 * Subscribe to user's notifications
 * @param {string} userId 
 * @param {Function} onNotification 
 * @returns {Function} Unsubscribe function
 */
export function subscribeToNotifications(userId, onNotification) {
  const channelName = `notifications:${userId}`;
  
  if (activeChannels.has(channelName)) {
    return activeChannels.get(channelName).unsubscribe;
  }

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: TABLES.NOTIFICATIONS,
        filter: `recipient_id=eq.${userId}`,
      },
      (payload) => {
        console.log(`[Realtime] New notification`);
        onNotification?.(payload.new);
      }
    )
    .subscribe();

  const unsubscribe = () => {
    channel.unsubscribe();
    activeChannels.delete(channelName);
  };

  activeChannels.set(channelName, { channel, unsubscribe });

  return unsubscribe;
}

// ============================================
// ORGANIZATION CHANNEL
// ============================================

/**
 * Subscribe to organization-wide events
 * @param {string} organizationId 
 * @param {Object} callbacks - { onMemberJoined, onMemberLeft, onActivityAdded }
 * @returns {Function} Unsubscribe function
 */
export function subscribeToOrganization(organizationId, callbacks = {}) {
  const channelName = `organization:${organizationId}`;
  
  if (activeChannels.has(channelName)) {
    return activeChannels.get(channelName).unsubscribe;
  }

  const channel = supabase
    .channel(channelName)
    // Member changes
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: TABLES.MEMBERS,
        filter: `organization_id=eq.${organizationId}`,
      },
      (payload) => {
        callbacks.onMemberJoined?.(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: TABLES.MEMBERS,
        filter: `organization_id=eq.${organizationId}`,
      },
      (payload) => {
        if (payload.new.status === 'suspended') {
          callbacks.onMemberLeft?.(payload.new);
        }
      }
    )
    // Activity feed
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: TABLES.ACTIVITIES,
        filter: `organization_id=eq.${organizationId}`,
      },
      (payload) => {
        callbacks.onActivityAdded?.(payload.new);
      }
    )
    .subscribe();

  const unsubscribe = () => {
    channel.unsubscribe();
    activeChannels.delete(channelName);
  };

  activeChannels.set(channelName, { channel, unsubscribe });

  return unsubscribe;
}

// ============================================
// CLEANUP
// ============================================

/**
 * Unsubscribe from all channels
 */
export function unsubscribeAll() {
  console.log(`[Realtime] Unsubscribing from all channels (${activeChannels.size})`);
  activeChannels.forEach(({ unsubscribe }) => unsubscribe());
  activeChannels.clear();
}

// ============================================
// HELPERS
// ============================================

/**
 * Generate consistent color for user based on ID
 */
function generateUserColor(userId) {
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16',
    '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
    '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  ];
  
  // Simple hash of ID to pick color
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
}

export default {
  subscribeToWorkspace,
  subscribeToOrganization,
  subscribeToNotifications,
  trackPresence,
  getWorkspacePresence,
  broadcastTyping,
  broadcastTaskEditing,
  broadcastCursor,
  unsubscribeAll,
};
