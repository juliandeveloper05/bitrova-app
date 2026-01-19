/**
 * Quota Service
 * TaskList App - Phase 4 Monetization
 * 
 * Handles usage quota tracking, enforcement, and syncing
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { SUBSCRIPTION_TIERS, getTierById } from '../constants/tiers';

const QUOTA_CACHE_KEY = '@quota_usage';

/**
 * Get current usage from local cache
 */
export const getLocalUsage = async () => {
  try {
    const cached = await AsyncStorage.getItem(QUOTA_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    return getDefaultUsage();
  } catch (error) {
    console.error('Failed to get local usage:', error);
    return getDefaultUsage();
  }
};

/**
 * Get default usage object
 */
const getDefaultUsage = () => ({
  tasksThisMonth: 0,
  storageBytes: 0,
  cycleStartDate: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
});

/**
 * Save usage to local cache
 */
export const saveLocalUsage = async (usage) => {
  try {
    await AsyncStorage.setItem(QUOTA_CACHE_KEY, JSON.stringify({
      ...usage,
      lastUpdated: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Failed to save local usage:', error);
  }
};

/**
 * Check if user can create a new task
 * @param {string} tierId - User's subscription tier
 * @param {number} currentCount - Current task count this month
 * @returns {Object} { allowed: boolean, remaining: number, limit: number }
 */
export const checkTaskQuota = (tierId, currentCount) => {
  const tier = getTierById(tierId);
  const limit = tier.limits.tasksPerMonth;
  
  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, remaining: -1, limit: -1 };
  }
  
  const remaining = Math.max(0, limit - currentCount);
  
  return {
    allowed: currentCount < limit,
    remaining,
    limit,
    usagePercent: Math.min(100, Math.round((currentCount / limit) * 100)),
  };
};

/**
 * Check if user can add an attachment
 * @param {string} tierId - User's subscription tier
 * @param {number} currentStorageBytes - Current storage used in bytes
 * @param {number} fileSizeBytes - Size of file to add in bytes
 * @returns {Object} { allowed: boolean, remaining: number, limit: number }
 */
export const checkStorageQuota = (tierId, currentStorageBytes, fileSizeBytes = 0) => {
  const tier = getTierById(tierId);
  const limitMB = tier.limits.storageMB;
  
  // -1 means unlimited
  if (limitMB === -1) {
    return { allowed: true, remaining: -1, limit: -1 };
  }
  
  const limitBytes = limitMB * 1024 * 1024;
  const currentMB = currentStorageBytes / (1024 * 1024);
  const remaining = Math.max(0, limitMB - currentMB);
  
  return {
    allowed: (currentStorageBytes + fileSizeBytes) <= limitBytes,
    remaining,
    remainingBytes: Math.max(0, limitBytes - currentStorageBytes),
    limit: limitMB,
    usagePercent: Math.min(100, Math.round((currentStorageBytes / limitBytes) * 100)),
  };
};

/**
 * Get quota warning status
 * @param {number} usagePercent - Current usage percentage
 * @returns {Object} { status: 'ok' | 'warning' | 'critical' | 'exceeded', color: string }
 */
export const getQuotaStatus = (usagePercent) => {
  if (usagePercent >= 100) {
    return { status: 'exceeded', color: '#EF4444', message: 'Quota exceeded' };
  }
  if (usagePercent >= 90) {
    return { status: 'critical', color: '#F59E0B', message: 'Almost at limit' };
  }
  if (usagePercent >= 75) {
    return { status: 'warning', color: '#EAB308', message: 'Approaching limit' };
  }
  return { status: 'ok', color: '#22C55E', message: 'Within quota' };
};

/**
 * Sync usage data with Supabase
 * @param {string} userId - User ID
 */
export const syncUsageWithSupabase = async (userId) => {
  if (!isSupabaseConfigured() || !userId) return null;
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('tasks_usage_current, storage_usage_bytes, cycle_start_date')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    const usage = {
      tasksThisMonth: profile.tasks_usage_current || 0,
      storageBytes: profile.storage_usage_bytes || 0,
      cycleStartDate: profile.cycle_start_date,
    };
    
    // Cache locally
    await saveLocalUsage(usage);
    
    return usage;
  } catch (error) {
    console.error('Failed to sync usage with Supabase:', error);
    return null;
  }
};

/**
 * Increment task count (client-side + Supabase)
 * Note: Supabase trigger also increments, this is for immediate UI update
 */
export const incrementTaskCount = async (userId) => {
  // Update local cache
  const localUsage = await getLocalUsage();
  localUsage.tasksThisMonth += 1;
  await saveLocalUsage(localUsage);
  
  // Note: Supabase trigger 'on_task_created' handles the server-side increment
  // This is just for immediate client-side feedback
  
  return localUsage.tasksThisMonth;
};

/**
 * Add storage usage
 * @param {string} userId - User ID
 * @param {number} bytes - Bytes to add
 */
export const addStorageUsage = async (userId, bytes) => {
  // Update local cache
  const localUsage = await getLocalUsage();
  localUsage.storageBytes += bytes;
  await saveLocalUsage(localUsage);
  
  // Update Supabase
  if (isSupabaseConfigured() && userId) {
    try {
      await supabase
        .from('profiles')
        .update({
          storage_usage_bytes: localUsage.storageBytes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Failed to update storage usage in Supabase:', error);
    }
  }
  
  return localUsage.storageBytes;
};

/**
 * Subtract storage usage (when deleting attachment)
 * @param {string} userId - User ID
 * @param {number} bytes - Bytes to subtract
 */
export const subtractStorageUsage = async (userId, bytes) => {
  // Update local cache
  const localUsage = await getLocalUsage();
  localUsage.storageBytes = Math.max(0, localUsage.storageBytes - bytes);
  await saveLocalUsage(localUsage);
  
  // Update Supabase
  if (isSupabaseConfigured() && userId) {
    try {
      await supabase
        .from('profiles')
        .update({
          storage_usage_bytes: Math.max(0, localUsage.storageBytes),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Failed to update storage usage in Supabase:', error);
    }
  }
  
  return localUsage.storageBytes;
};

/**
 * Reset monthly task count (should be called by a scheduled job)
 * This is typically handled by a Supabase CRON function
 */
export const resetMonthlyCounts = async (userId) => {
  if (!isSupabaseConfigured() || !userId) return;
  
  try {
    await supabase
      .from('profiles')
      .update({
        tasks_usage_current: 0,
        cycle_start_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    
    // Update local cache
    const localUsage = await getLocalUsage();
    localUsage.tasksThisMonth = 0;
    localUsage.cycleStartDate = new Date().toISOString();
    await saveLocalUsage(localUsage);
    
  } catch (error) {
    console.error('Failed to reset monthly counts:', error);
  }
};

/**
 * Calculate full usage summary for UI
 */
export const getUsageSummary = async (userId, tierId) => {
  const usage = userId 
    ? await syncUsageWithSupabase(userId) 
    : await getLocalUsage();
  
  const taskQuota = checkTaskQuota(tierId, usage?.tasksThisMonth || 0);
  const storageQuota = checkStorageQuota(tierId, usage?.storageBytes || 0);
  
  return {
    tasks: {
      current: usage?.tasksThisMonth || 0,
      ...taskQuota,
      status: getQuotaStatus(taskQuota.usagePercent || 0),
    },
    storage: {
      currentBytes: usage?.storageBytes || 0,
      currentMB: (usage?.storageBytes || 0) / (1024 * 1024),
      ...storageQuota,
      status: getQuotaStatus(storageQuota.usagePercent || 0),
    },
    cycleStartDate: usage?.cycleStartDate,
  };
};

export default {
  getLocalUsage,
  saveLocalUsage,
  checkTaskQuota,
  checkStorageQuota,
  getQuotaStatus,
  syncUsageWithSupabase,
  incrementTaskCount,
  addStorageUsage,
  subtractStorageUsage,
  resetMonthlyCounts,
  getUsageSummary,
};
