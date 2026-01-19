/**
 * useWorkspaceSync Hook
 * Bitrova TaskList App - Phase 3 B2B
 * 
 * Provides real-time synchronization for workspace data
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import realtimeService from '../services/realtimeService';

/**
 * Hook for real-time workspace synchronization
 * 
 * @param {Object} callbacks - Optional callbacks for events
 * @returns {Object} { isConnected, activeUsers, typingUsers, refresh }
 */
export function useWorkspaceSync(callbacks = {}) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeouts = useRef({});

  // Subscribe to workspace when it changes
  useEffect(() => {
    if (!currentWorkspace?.id || !user) {
      setIsConnected(false);
      setActiveUsers([]);
      return;
    }

    const workspaceId = currentWorkspace.id;

    // Subscribe to realtime updates
    const unsubscribe = realtimeService.subscribeToWorkspace(workspaceId, {
      // Task changes
      onTaskChange: (payload) => {
        callbacks.onTaskChange?.(payload);
      },

      // Comment added
      onCommentAdded: (payload) => {
        callbacks.onCommentAdded?.(payload);
      },

      // Presence sync
      onPresenceSync: (presenceState) => {
        const users = Object.values(presenceState).flat();
        // Filter out current user
        const otherUsers = users.filter(u => u.user_id !== user.id);
        setActiveUsers(otherUsers);
        setIsConnected(true);
        callbacks.onPresenceSync?.(users);
      },

      // User joined
      onUserJoined: (newPresences) => {
        callbacks.onUserJoined?.(newPresences);
      },

      // User left
      onUserLeft: (leftPresences) => {
        callbacks.onUserLeft?.(leftPresences);
      },

      // Typing indicators
      onTyping: ({ userId, taskId, isTyping }) => {
        if (isTyping) {
          // Add to typing users
          setTypingUsers(prev => ({
            ...prev,
            [taskId]: [...(prev[taskId] || []).filter(id => id !== userId), userId],
          }));

          // Clear after 5 seconds
          if (typingTimeouts.current[`${taskId}-${userId}`]) {
            clearTimeout(typingTimeouts.current[`${taskId}-${userId}`]);
          }
          typingTimeouts.current[`${taskId}-${userId}`] = setTimeout(() => {
            setTypingUsers(prev => ({
              ...prev,
              [taskId]: (prev[taskId] || []).filter(id => id !== userId),
            }));
          }, 5000);
        } else {
          // Remove from typing users
          setTypingUsers(prev => ({
            ...prev,
            [taskId]: (prev[taskId] || []).filter(id => id !== userId),
          }));
        }
        callbacks.onTyping?.({ userId, taskId, isTyping });
      },

      // Task being edited
      onTaskEditing: (payload) => {
        callbacks.onTaskEditing?.(payload);
      },
    });

    // Track own presence
    const userInfo = {
      id: user.id,
      name: user.user_metadata?.display_name || user.email?.split('@')[0],
      avatar: user.user_metadata?.avatar_url,
    };
    realtimeService.trackPresence(workspaceId, userInfo);

    return () => {
      unsubscribe();
      setIsConnected(false);
      // Clear all typing timeouts
      Object.values(typingTimeouts.current).forEach(clearTimeout);
    };
  }, [currentWorkspace?.id, user?.id]);

  // Send typing indicator
  const sendTyping = useCallback((taskId, isTyping) => {
    if (!currentWorkspace?.id) return;
    realtimeService.broadcastTyping(currentWorkspace.id, taskId, isTyping);
  }, [currentWorkspace?.id]);

  // Send task editing status
  const sendTaskEditing = useCallback((taskId, field = null) => {
    if (!currentWorkspace?.id) return;
    realtimeService.broadcastTaskEditing(currentWorkspace.id, taskId, field);
  }, [currentWorkspace?.id]);

  // Get users typing on a specific task
  const getTypingUsers = useCallback((taskId) => {
    return typingUsers[taskId] || [];
  }, [typingUsers]);

  // Check if someone else is editing a task
  const isTaskBeingEdited = useCallback((taskId) => {
    return (typingUsers[taskId] || []).length > 0;
  }, [typingUsers]);

  return {
    isConnected,
    activeUsers,
    typingUsers,
    sendTyping,
    sendTaskEditing,
    getTypingUsers,
    isTaskBeingEdited,
  };
}

/**
 * Hook for subscribing to notifications
 * 
 * @param {Function} onNotification - Callback for new notifications
 */
export function useNotifications(onNotification) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = realtimeService.subscribeToNotifications(user.id, (notification) => {
      setUnreadCount(prev => prev + 1);
      onNotification?.(notification);
    });

    return unsubscribe;
  }, [user?.id]);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    unreadCount,
    markAsRead,
  };
}

export default useWorkspaceSync;
