/**
 * Notification Service
 * Bitrova TaskList App - Phase 3 B2B
 * 
 * Handle in-app notifications
 */

import { supabase, TABLES } from '../config/supabase';

/**
 * Get notifications for current user
 */
export async function getNotifications({ limit = 50, unreadOnly = false } = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be authenticated');

  let query = supabase
    .from(TABLES.NOTIFICATIONS)
    .select('*')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get unread notification count
 */
export async function getUnreadCount() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from(TABLES.NOTIFICATIONS)
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('read', false);

  if (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be authenticated');

  const { error } = await supabase
    .from(TABLES.NOTIFICATIONS)
    .update({ read: true, seen: true })
    .eq('id', notificationId)
    .eq('recipient_id', user.id);

  if (error) throw error;
  return true;
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be authenticated');

  const { error } = await supabase
    .from(TABLES.NOTIFICATIONS)
    .update({ read: true, seen: true })
    .eq('recipient_id', user.id)
    .eq('read', false);

  if (error) throw error;
  return true;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be authenticated');

  const { error } = await supabase
    .from(TABLES.NOTIFICATIONS)
    .delete()
    .eq('id', notificationId)
    .eq('recipient_id', user.id);

  if (error) throw error;
  return true;
}

/**
 * Create a notification
 */
export async function createNotification({
  recipientId,
  organizationId,
  type,
  title,
  body,
  data = {},
  actionUrl,
}) {
  const { error } = await supabase
    .from(TABLES.NOTIFICATIONS)
    .insert({
      recipient_id: recipientId,
      organization_id: organizationId,
      type,
      title,
      body,
      data,
      action_url: actionUrl,
    });

  if (error) throw error;
  return true;
}

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
};
