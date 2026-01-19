/**
 * Subscription Context
 * TaskList App - Phase 4 Monetization
 * 
 * Global subscription state management
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import {
  initializeRevenueCat,
  identifyUser,
  getCustomerInfo,
  getActiveTier,
  addSubscriptionListener,
  logoutUser,
  syncSubscriptionToSupabase,
} from '../services/subscriptionService';
import { SUBSCRIPTION_TIERS, getTierById, isFeatureAvailable } from '../constants/tiers';

const SubscriptionContext = createContext();

const SUBSCRIPTION_CACHE_KEY = '@subscription_cache';

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  const [tier, setTier] = useState('free');
  const [isLegacy, setIsLegacy] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState({
    tasksThisMonth: 0,
    storageMB: 0,
    cycleStartDate: null,
  });

  // Initialize RevenueCat on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initializeRevenueCat();
      } catch (error) {
        console.error('RevenueCat init error:', error);
      }
    };
    init();
  }, []);

  // Load cached subscription data on mount
  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(SUBSCRIPTION_CACHE_KEY);
        if (cached) {
          const data = JSON.parse(cached);
          setTier(data.tier || 'free');
          setIsLegacy(data.isLegacy || false);
          setUsage(data.usage || { tasksThisMonth: 0, storageMB: 0 });
        }
      } catch (error) {
        console.error('Failed to load subscription cache:', error);
      }
    };
    loadCache();
  }, []);

  // Fetch subscription status when user authenticates
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!isAuthenticated || !user) {
        setTier('free');
        setIsLegacy(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1. Identify user in RevenueCat
        if (Platform.OS !== 'web') {
          await identifyUser(user.id);
        }

        // 2. Get customer info from RevenueCat
        const info = await getCustomerInfo();
        setCustomerInfo(info);
        
        // 3. Determine tier from RevenueCat
        let currentTier = getActiveTier(info);

        // 4. Fetch profile from Supabase (for is_legacy and usage)
        if (isSupabaseConfigured()) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('tier, is_legacy, tasks_usage_current, storage_usage_bytes, cycle_start_date')
            .eq('id', user.id)
            .single();

          if (!error && profile) {
            // Legacy users get Pro access
            if (profile.is_legacy) {
              setIsLegacy(true);
              currentTier = 'pro';
            }

            // Update usage from Supabase
            setUsage({
              tasksThisMonth: profile.tasks_usage_current || 0,
              storageMB: (profile.storage_usage_bytes || 0) / (1024 * 1024),
              cycleStartDate: profile.cycle_start_date,
            });
          }
        }

        setTier(currentTier);

        // Cache the subscription data
        await AsyncStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify({
          tier: currentTier,
          isLegacy,
          usage,
        }));

      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [isAuthenticated, user]);

  // Listen for subscription changes
  useEffect(() => {
    const unsubscribe = addSubscriptionListener(({ customerInfo: info, tier: newTier }) => {
      setCustomerInfo(info);
      setTier(isLegacy ? 'pro' : newTier);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [isLegacy]);

  // Clear subscription on logout
  useEffect(() => {
    if (!isAuthenticated) {
      logoutUser();
      setTier('free');
      setIsLegacy(false);
      setCustomerInfo(null);
      setUsage({ tasksThisMonth: 0, storageMB: 0, cycleStartDate: null });
    }
  }, [isAuthenticated]);

  /**
   * Get the current tier object with all limits/features
   */
  const getCurrentTier = useCallback(() => {
    return getTierById(tier);
  }, [tier]);

  /**
   * Check if a specific feature is available
   */
  const canAccessFeature = useCallback((featureId) => {
    // Legacy users get Pro access
    const effectiveTier = isLegacy ? 'pro' : tier;
    return isFeatureAvailable(featureId, effectiveTier);
  }, [tier, isLegacy]);

  /**
   * Check if user is within task quota
   */
  const canCreateTask = useCallback(() => {
    const tierConfig = getCurrentTier();
    const limit = tierConfig.limits.tasksPerMonth;
    
    // -1 means unlimited
    if (limit === -1) return true;
    
    return usage.tasksThisMonth < limit;
  }, [getCurrentTier, usage.tasksThisMonth]);

  /**
   * Get remaining task quota
   */
  const getRemainingTasks = useCallback(() => {
    const tierConfig = getCurrentTier();
    const limit = tierConfig.limits.tasksPerMonth;
    
    if (limit === -1) return -1; // Unlimited
    
    return Math.max(0, limit - usage.tasksThisMonth);
  }, [getCurrentTier, usage.tasksThisMonth]);

  /**
   * Check if user is within storage quota
   */
  const canAddAttachment = useCallback((fileSizeMB = 0) => {
    const tierConfig = getCurrentTier();
    const limit = tierConfig.limits.storageMB;
    
    if (limit === -1) return true;
    
    return (usage.storageMB + fileSizeMB) <= limit;
  }, [getCurrentTier, usage.storageMB]);

  /**
   * Get storage usage percentage
   */
  const getStorageUsagePercent = useCallback(() => {
    const tierConfig = getCurrentTier();
    const limit = tierConfig.limits.storageMB;
    
    if (limit === -1) return 0;
    
    return Math.min(100, Math.round((usage.storageMB / limit) * 100));
  }, [getCurrentTier, usage.storageMB]);

  /**
   * Increment task usage (called when a task is created)
   */
  const incrementTaskUsage = useCallback(async () => {
    setUsage(prev => ({
      ...prev,
      tasksThisMonth: prev.tasksThisMonth + 1,
    }));

    // Sync to Supabase
    if (isSupabaseConfigured() && user) {
      try {
        await supabase.rpc('increment_task_count', { user_uuid: user.id });
      } catch (error) {
        console.error('Failed to increment task count in Supabase:', error);
      }
    }
  }, [user]);

  /**
   * Refresh usage data from Supabase
   */
  const refreshUsage = useCallback(async () => {
    if (!isSupabaseConfigured() || !user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('tasks_usage_current, storage_usage_bytes, cycle_start_date')
        .eq('id', user.id)
        .single();

      if (!error && profile) {
        setUsage({
          tasksThisMonth: profile.tasks_usage_current || 0,
          storageMB: (profile.storage_usage_bytes || 0) / (1024 * 1024),
          cycleStartDate: profile.cycle_start_date,
        });
      }
    } catch (error) {
      console.error('Failed to refresh usage:', error);
    }
  }, [user]);

  const value = {
    // State
    tier,
    isLegacy,
    customerInfo,
    loading,
    usage,
    
    // Computed
    isPro: tier === 'pro' || tier === 'enterprise',
    isEnterprise: tier === 'enterprise',
    
    // Methods
    getCurrentTier,
    canAccessFeature,
    canCreateTask,
    getRemainingTasks,
    canAddAttachment,
    getStorageUsagePercent,
    incrementTaskUsage,
    refreshUsage,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext;
