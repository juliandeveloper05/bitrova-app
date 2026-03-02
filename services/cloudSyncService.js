/**
 * Cloud Sync Service
 * TaskList App - Phase 2 Cloud Backup
 * 
 * Handles synchronization between local storage and Supabase cloud
 */

import { supabase, TABLES, SYNC_CONFIG, isSupabaseConfigured } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const LAST_SYNC_KEY = '@tasklist_last_sync';
const SYNC_QUEUE_KEY = '@tasklist_sync_queue';
const USER_ID_KEY = '@tasklist_user_id';

/**
 * Get current user ID
 */
export const getCurrentUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

/**
 * Get last sync timestamp
 */
export const getLastSyncTime = async () => {
  try {
    const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return lastSync ? new Date(lastSync) : null;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
};

/**
 * Set last sync timestamp
 */
export const setLastSyncTime = async (date = new Date()) => {
  try {
    await AsyncStorage.setItem(LAST_SYNC_KEY, date.toISOString());
  } catch (error) {
    console.error('Error setting last sync time:', error);
  }
};

/**
 * Convert local task to cloud format
 */
const taskToCloudFormat = (task, userId, activeOrgId = null) => {
  return {
    id: task.id,
    user_id: userId,
    organization_id: activeOrgId || null, // Multi-tenant isolation (Phase 3)
    title: task.title,
    description: task.description || null,
    category: task.category || 'personal',
    priority: task.priority || 'medium',
    completed: task.completed || false,
    due_date: task.dueDate || null,
    enable_reminder: task.enableReminder || false,
    subtasks: JSON.stringify(task.subtasks || []),
    attachments: JSON.stringify((task.attachments || []).map(a => ({
      id: a.id,
      filename: a.filename,
      type: a.type,
      filesize: a.filesize,
    }))),
    is_recurring: task.isRecurring || false,
    recurring_series_id: task.recurringSeriesId || null,
    instance_date: task.instanceDate || null,
    skipped: task.skipped || false,
    created_at: task.createdAt || new Date().toISOString(),
    updated_at: task.updatedAt || new Date().toISOString(),
    synced_at: new Date().toISOString(),
    version: (task.version || 0) + 1,
    deleted: false,
  };
};

/**
 * Convert cloud task to local format
 */
const taskToLocalFormat = (cloudTask) => {
  return {
    id: cloudTask.id,
    title: cloudTask.title,
    description: cloudTask.description || '',
    category: cloudTask.category || 'personal',
    priority: cloudTask.priority || 'medium',
    completed: cloudTask.completed || false,
    dueDate: cloudTask.due_date,
    enableReminder: cloudTask.enable_reminder || false,
    subtasks: typeof cloudTask.subtasks === 'string' 
      ? JSON.parse(cloudTask.subtasks) 
      : (cloudTask.subtasks || []),
    attachments: typeof cloudTask.attachments === 'string'
      ? JSON.parse(cloudTask.attachments)
      : (cloudTask.attachments || []),
    isRecurring: cloudTask.is_recurring || false,
    recurringSeriesId: cloudTask.recurring_series_id,
    instanceDate: cloudTask.instance_date,
    skipped: cloudTask.skipped || false,
    notificationId: null,
    createdAt: cloudTask.created_at,
    updatedAt: cloudTask.updated_at,
    syncedAt: cloudTask.synced_at,
    version: cloudTask.version || 1,
  };
};

/**
 * Upload local tasks to cloud (full sync)
 * @param {Array} localTasks - Local tasks to sync
 * @returns {Promise<Object>} Sync result
 */
export const uploadToCloud = async (localTasks, activeOrgId = null) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no está configurado');
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('Usuario no autenticado');
  }

  try {
    const cloudTasks = localTasks.map(task => taskToCloudFormat(task, userId, activeOrgId));
    
    // Upsert tasks in batches
    const batchSize = SYNC_CONFIG.BATCH_SIZE;
    let uploaded = 0;
    
    for (let i = 0; i < cloudTasks.length; i += batchSize) {
      const batch = cloudTasks.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from(TABLES.TASKS)
        .upsert(batch, { 
          onConflict: 'id',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error('Error uploading batch:', error);
        throw error;
      }
      
      uploaded += batch.length;
    }

    await setLastSyncTime();

    return {
      success: true,
      uploaded,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error uploading to cloud:', error);
    throw error;
  }
};

/**
 * Download tasks from cloud
 * @returns {Promise<Array>} Cloud tasks in local format
 */
export const downloadFromCloud = async (activeOrgId = null) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no está configurado');
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('Usuario no autenticado');
  }

  try {
    // Multi-tenant query branching (Phase 3 — Milestone 4)
    let query = supabase
      .from(TABLES.TASKS)
      .select('*')
      .eq('deleted', false)
      .order('updated_at', { ascending: false });

    if (activeOrgId) {
      query = query.eq('organization_id', activeOrgId);
    } else {
      query = query.eq('user_id', userId).is('organization_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error downloading from cloud:', error);
      throw error;
    }

    return (data || []).map(taskToLocalFormat);
  } catch (error) {
    console.error('Error downloading from cloud:', error);
    throw error;
  }
};

/**
 * Sync local and cloud tasks
 * Uses "server wins" conflict resolution by default
 * @param {Array} localTasks - Current local tasks
 * @returns {Promise<Object>} Sync result with merged tasks
 */
export const syncTasks = async (localTasks, activeOrgId = null) => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase no está configurado',
      tasks: localTasks,
    };
  }

  const isAuth = await isAuthenticated();
  if (!isAuth) {
    return {
      success: false,
      error: 'Usuario no autenticado',
      tasks: localTasks,
    };
  }

  try {
    const userId = await getCurrentUserId();
    const lastSync = await getLastSyncTime();

    // Get cloud tasks — scoped by activeOrgId
    const cloudTasks = await downloadFromCloud(activeOrgId);
    
    // Build maps for comparison
    const localMap = new Map(localTasks.map(t => [t.id, t]));
    const cloudMap = new Map(cloudTasks.map(t => [t.id, t]));

    const mergedTasks = [];
    const conflicts = [];
    const toUpload = [];

    // Process all unique task IDs
    const allIds = new Set([...localMap.keys(), ...cloudMap.keys()]);

    for (const id of allIds) {
      const local = localMap.get(id);
      const cloud = cloudMap.get(id);

      if (local && cloud) {
        // Both exist - check for conflicts
        const localUpdated = new Date(local.updatedAt || 0);
        const cloudUpdated = new Date(cloud.updatedAt || 0);

        if (SYNC_CONFIG.CONFLICT_RESOLUTION === 'server_wins') {
          // Server (cloud) wins
          if (cloudUpdated >= localUpdated) {
            mergedTasks.push({ ...local, ...cloud, syncedAt: new Date().toISOString() });
          } else {
            mergedTasks.push(local);
            toUpload.push(local);
          }
        } else if (SYNC_CONFIG.CONFLICT_RESOLUTION === 'client_wins') {
          // Client (local) wins
          mergedTasks.push(local);
          toUpload.push(local);
        } else {
          // Merge - keep most recent updatedAt, merge subtasks and attachments
          const merged = cloudUpdated >= localUpdated ? cloud : local;
          mergedTasks.push({
            ...merged,
            subtasks: mergeArrays(local.subtasks, cloud.subtasks, 'id'),
            syncedAt: new Date().toISOString(),
          });
          conflicts.push({ local, cloud, resolved: merged });
        }
      } else if (local && !cloud) {
        // Only exists locally - upload to cloud
        mergedTasks.push(local);
        toUpload.push(local);
      } else if (!local && cloud) {
        // Only exists in cloud - download to local
        mergedTasks.push(cloud);
      }
    }

    // Upload local-only tasks to cloud
    if (toUpload.length > 0) {
      const uploadTasks = toUpload.map(t => taskToCloudFormat(t, userId, activeOrgId));
      
      const { error } = await supabase
        .from(TABLES.TASKS)
        .upsert(uploadTasks, { onConflict: 'id' });

      if (error) {
        console.error('Error uploading during sync:', error);
      }
    }

    await setLastSyncTime();

    return {
      success: true,
      tasks: mergedTasks,
      stats: {
        total: mergedTasks.length,
        uploaded: toUpload.length,
        downloaded: cloudTasks.filter(c => !localMap.has(c.id)).length,
        conflicts: conflicts.length,
      },
      lastSync: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Sync error:', error);
    return {
      success: false,
      error: error.message,
      tasks: localTasks,
    };
  }
};

/**
 * Delete task from cloud
 * @param {string} taskId - Task ID to delete
 */
export const deleteFromCloud = async (taskId) => {
  if (!isSupabaseConfigured()) return;

  const userId = await getCurrentUserId();
  if (!userId) return;

  try {
    // Soft delete - mark as deleted
    await supabase
      .from(TABLES.TASKS)
      .update({ deleted: true, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .eq('user_id', userId);
  } catch (error) {
    console.error('Error deleting from cloud:', error);
  }
};

/**
 * Helper to merge arrays by ID
 */
const mergeArrays = (arr1 = [], arr2 = [], idKey = 'id') => {
  const map = new Map();
  
  arr1.forEach(item => map.set(item[idKey], item));
  arr2.forEach(item => {
    if (!map.has(item[idKey])) {
      map.set(item[idKey], item);
    }
  });
  
  return Array.from(map.values());
};

/**
 * Get sync status information
 */
export const getSyncStatus = async () => {
  const isConfigured = isSupabaseConfigured();
  const isAuth = await isAuthenticated();
  const lastSync = await getLastSyncTime();

  return {
    isConfigured,
    isAuthenticated: isAuth,
    lastSync,
    lastSyncFormatted: lastSync 
      ? new Date(lastSync).toLocaleString('es-ES') 
      : 'Nunca',
  };
};

export default {
  isAuthenticated,
  getCurrentUserId,
  getLastSyncTime,
  uploadToCloud,
  downloadFromCloud,
  syncTasks,
  deleteFromCloud,
  getSyncStatus,
};
