/**
 * Comment Service
 * Bitrova TaskList App - Phase 3 B2B
 * 
 * Handle comments on tasks with @mentions
 */

import { supabase, TABLES } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Regex to find @mentions in text
const MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g;
const SIMPLE_MENTION_REGEX = /@(\w+)/g;

// Storage key for tasks (same as used in storage.js)
const TASKS_STORAGE_KEY = '@tasklist_tasks';

/**
 * Ensure task exists in Supabase before creating a comment
 * This prevents foreign key constraint violations
 */
async function ensureTaskExistsInCloud(taskId, organizationId, workspaceId, userId) {
  // Check if task already exists in cloud
  const { data: existingTask, error: checkError } = await supabase
    .from(TABLES.TASKS)
    .select('id')
    .eq('id', taskId)
    .maybeSingle();

  if (existingTask) {
    // Task exists, nothing to do
    return true;
  }

  // Task doesn't exist - try to load from local storage and sync
  try {
    const tasksJson = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
    const localTasks = tasksJson ? JSON.parse(tasksJson) : [];
    const localTask = localTasks.find(t => t.id === taskId);

    if (localTask) {
      // Convert local task to cloud format and upsert
      const cloudTask = {
        id: localTask.id,
        user_id: userId,
        title: localTask.title,
        description: localTask.description || null,
        category: localTask.category || 'personal',
        priority: localTask.priority || 'medium',
        completed: localTask.completed || false,
        due_date: localTask.dueDate || null,
        enable_reminder: localTask.enableReminder || false,
        subtasks: JSON.stringify(localTask.subtasks || []),
        attachments: JSON.stringify((localTask.attachments || []).map(a => ({
          id: a.id,
          filename: a.filename,
          type: a.type,
          filesize: a.filesize,
        }))),
        is_recurring: localTask.isRecurring || false,
        recurring_series_id: localTask.recurringSeriesId || null,
        instance_date: localTask.instanceDate || null,
        skipped: localTask.skipped || false,
        created_at: localTask.createdAt || new Date().toISOString(),
        updated_at: localTask.updatedAt || new Date().toISOString(),
        synced_at: new Date().toISOString(),
        version: (localTask.version || 0) + 1,
        deleted: false,
        // B2B fields
        organization_id: organizationId,
        workspace_id: workspaceId,
      };

      const { error: upsertError } = await supabase
        .from(TABLES.TASKS)
        .upsert(cloudTask, { onConflict: 'id' });

      if (upsertError) {
        console.error('Error syncing task to cloud for comments:', upsertError);
        throw new Error(`No se pudo sincronizar la tarea: ${upsertError.message}`);
      }

      return true;
    }
  } catch (storageError) {
    console.error('Error accessing local storage:', storageError);
  }

  throw new Error('La tarea no existe. Por favor, sincroniza tus tareas primero.');
}

/**
 * Create a new comment on a task
 */
export async function createComment({
  taskId,
  content,
  workspaceId,
  organizationId,
  parentId = null,
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be authenticated');

  // Ensure task exists in Supabase before creating comment
  await ensureTaskExistsInCloud(taskId, organizationId, workspaceId, user.id);

  // Extract mentions from content
  const mentions = extractMentions(content);

  const { data, error } = await supabase
    .from(TABLES.COMMENTS)
    .insert({
      task_id: taskId,
      workspace_id: workspaceId,
      organization_id: organizationId,
      author_id: user.id,
      content,
      mentions,
      parent_id: parentId,
    })
    .select('*')
    .single();

  if (error) throw error;

  // Add author info from current user
  const enrichedData = {
    ...data,
    author: {
      id: user.id,
      email: user.email,
      raw_user_meta_data: user.user_metadata,
    },
  };

  // Create notifications for mentioned users
  if (mentions.length > 0) {
    await createMentionNotifications(data, mentions, user);
  }

  return enrichedData;
}

/**
 * Get comments for a task
 */
export async function getTaskComments(taskId, { limit = 50, offset = 0 } = {}) {
  const { data, error } = await supabase
    .from(TABLES.COMMENTS)
    .select('*')
    .eq('task_id', taskId)
    .is('parent_id', null) // Top-level comments only
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  
  // For now, return comments without author data since auth.users JOINs are not allowed
  // Author info can be looked up from profiles table if needed
  return (data || []).map(comment => ({
    ...comment,
    author: {
      id: comment.author_id,
      email: null, // Would need separate profile lookup
      raw_user_meta_data: { display_name: 'User' },
    },
    replies: [],
  }));
}

/**
 * Update a comment
 */
export async function updateComment(commentId, content) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be authenticated');

  const mentions = extractMentions(content);

  const { data, error } = await supabase
    .from(TABLES.COMMENTS)
    .update({
      content,
      mentions,
      edited_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .eq('author_id', user.id) // Only author can edit
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a comment (soft delete)
 */
export async function deleteComment(commentId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be authenticated');

  const { error } = await supabase
    .from(TABLES.COMMENTS)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('author_id', user.id);

  if (error) throw error;
  return true;
}

/**
 * Add reaction to a comment
 */
export async function addReaction(commentId, emoji) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be authenticated');

  // First get current reactions
  const { data: comment, error: fetchError } = await supabase
    .from(TABLES.COMMENTS)
    .select('reactions')
    .eq('id', commentId)
    .single();

  if (fetchError) throw fetchError;

  const reactions = comment.reactions || [];
  
  // Check if user already reacted with this emoji
  const existingIndex = reactions.findIndex(
    r => r.emoji === emoji && r.userId === user.id
  );

  if (existingIndex >= 0) {
    // Remove reaction (toggle off)
    reactions.splice(existingIndex, 1);
  } else {
    // Add reaction
    reactions.push({
      emoji,
      userId: user.id,
      createdAt: new Date().toISOString(),
    });
  }

  const { data, error } = await supabase
    .from(TABLES.COMMENTS)
    .update({ reactions })
    .eq('id', commentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Extract @mentions from content
 * Supports both simple @username and formatted @[Display Name](userId) mentions
 */
function extractMentions(content) {
  const mentions = [];
  
  // Extract formatted mentions: @[Display Name](userId)
  let match;
  while ((match = MENTION_REGEX.exec(content)) !== null) {
    mentions.push({
      displayName: match[1],
      userId: match[2],
    });
  }

  return mentions;
}

/**
 * Create notifications for mentioned users
 */
async function createMentionNotifications(comment, mentions, author) {
  const notifications = mentions.map(mention => ({
    recipient_id: mention.userId,
    organization_id: comment.organization_id,
    type: 'mention',
    title: 'You were mentioned',
    body: `${author.email} mentioned you in a comment`,
    data: {
      commentId: comment.id,
      taskId: comment.task_id,
      authorId: author.id,
    },
    action_url: `/task-details?taskId=${comment.task_id}`,
  }));

  if (notifications.length > 0) {
    await supabase
      .from(TABLES.NOTIFICATIONS)
      .insert(notifications);
  }
}

/**
 * Search users for mentions (autocomplete)
 */
export async function searchUsersForMention(query, organizationId) {
  if (!query || query.length < 2) return [];

  const { data, error } = await supabase
    .from(TABLES.MEMBERS)
    .select(`
      id,
      user:user_id (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .limit(10);

  if (error) throw error;

  // Filter by query
  const searchTerm = query.toLowerCase();
  return (data || [])
    .map(member => ({
      id: member.user.id,
      email: member.user.email,
      displayName: member.user.raw_user_meta_data?.display_name || 
                   member.user.email.split('@')[0],
    }))
    .filter(user => 
      user.displayName.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm)
    );
}

/**
 * Format content with mention highlights
 */
export function formatMentionsForDisplay(content) {
  // Replace @[Display Name](userId) with styled text
  return content.replace(MENTION_REGEX, '@$1');
}

/**
 * Get mention suggestions from content
 */
export function getMentionTrigger(text, cursorPosition) {
  const beforeCursor = text.slice(0, cursorPosition);
  const match = beforeCursor.match(/@(\w*)$/);
  
  if (match) {
    return {
      trigger: true,
      query: match[1],
      startIndex: beforeCursor.length - match[0].length,
    };
  }
  
  return { trigger: false };
}

export default {
  createComment,
  getTaskComments,
  updateComment,
  deleteComment,
  addReaction,
  searchUsersForMention,
  formatMentionsForDisplay,
  getMentionTrigger,
  extractMentions,
};
