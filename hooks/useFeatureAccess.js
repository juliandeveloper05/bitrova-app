/**
 * useFeatureAccess Hook
 * TaskList App - Phase 4 Monetization
 * 
 * Custom hook for feature gating and paywall triggers
 */

import { useCallback, useMemo } from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import { FEATURES, getMinTierForFeature, compareTiers, SUBSCRIPTION_TIERS } from '../constants/tiers';

/**
 * Hook for checking feature access and triggering paywalls
 * 
 * @param {Function} showPaywallFn - Function to display paywall modal (injected from component)
 * @returns {Object} Feature access utilities
 */
export const useFeatureAccess = (showPaywallFn = null) => {
  const { tier, isLegacy, canAccessFeature, isPro, isEnterprise } = useSubscription();

  /**
   * Check if user can access a feature
   */
  const hasAccess = useCallback((featureId) => {
    // Legacy users get Pro-level access
    if (isLegacy) {
      const minTier = getMinTierForFeature(featureId);
      return compareTiers('pro', minTier) >= 0;
    }
    
    return canAccessFeature(featureId);
  }, [isLegacy, canAccessFeature]);

  /**
   * Get the reason why a feature is locked
   */
  const getUpgradeReason = useCallback((featureId) => {
    const feature = FEATURES[featureId];
    if (!feature) return null;

    const minTier = feature.minTier;
    const tierConfig = SUBSCRIPTION_TIERS[minTier.toUpperCase()];
    
    return {
      featureName: feature.name,
      description: feature.description,
      requiredTier: minTier,
      requiredTierName: tierConfig?.displayName || 'Pro',
      currentTier: tier,
    };
  }, [tier]);

  /**
   * Attempt to access a feature - shows paywall if locked
   * Returns true if access granted, false if blocked
   */
  const requestAccess = useCallback((featureId) => {
    if (hasAccess(featureId)) {
      return true;
    }

    // Trigger paywall if function provided
    if (showPaywallFn) {
      const reason = getUpgradeReason(featureId);
      showPaywallFn(reason);
    }

    return false;
  }, [hasAccess, showPaywallFn, getUpgradeReason]);

  /**
   * Higher-order function to wrap feature-gated actions
   * Usage: onPress={withFeatureGate('ai_priorities', myAction)}
   */
  const withFeatureGate = useCallback((featureId, action) => {
    return (...args) => {
      if (requestAccess(featureId)) {
        return action(...args);
      }
      // Feature blocked, paywall shown
      return null;
    };
  }, [requestAccess]);

  /**
   * Get badge/indicator for a feature
   */
  const getFeatureBadge = useCallback((featureId) => {
    if (hasAccess(featureId)) {
      return null;
    }

    const minTier = getMinTierForFeature(featureId);
    
    if (minTier === 'enterprise') {
      return { label: '👑', tier: 'enterprise' };
    }
    
    return { label: '⚡', tier: 'pro' };
  }, [hasAccess]);

  /**
   * Get all locked features for current tier
   */
  const lockedFeatures = useMemo(() => {
    return Object.values(FEATURES)
      .filter(feature => !hasAccess(feature.id))
      .map(feature => ({
        ...feature,
        badge: getFeatureBadge(feature.id),
      }));
  }, [hasAccess, getFeatureBadge]);

  /**
   * Get all available features for current tier
   */
  const availableFeatures = useMemo(() => {
    return Object.values(FEATURES).filter(feature => hasAccess(feature.id));
  }, [hasAccess]);

  /**
   * Quick access checks for common features
   */
  const featureFlags = useMemo(() => ({
    cloudSync: hasAccess('cloud_sync'),
    unlimitedAttachments: hasAccess('attachments_unlimited'),
    recurringTasks: hasAccess('recurring_tasks'),
    analytics: hasAccess('analytics'),
    aiPriorities: hasAccess('ai_priorities'),
    smartDueDates: hasAccess('smart_due_dates'),
    weeklyReports: hasAccess('weekly_reports'),
    teamWorkspaces: hasAccess('team_workspaces'),
    apiAccess: hasAccess('api_access'),
  }), [hasAccess]);

  return {
    // Core methods
    hasAccess,
    requestAccess,
    withFeatureGate,
    getUpgradeReason,
    getFeatureBadge,
    
    // Feature lists
    lockedFeatures,
    availableFeatures,
    
    // Quick flags
    ...featureFlags,
    
    // Tier shortcuts
    isPro,
    isEnterprise,
    isLegacy,
    currentTier: tier,
  };
};

/**
 * Render prop component for conditional feature rendering
 * 
 * Usage:
 * <FeatureGate feature="ai_priorities" fallback={<ProBadge />}>
 *   <AIPriorityButton />
 * </FeatureGate>
 */
export const FeatureGate = ({ feature, children, fallback = null, showLockIcon = false }) => {
  const { hasAccess, getFeatureBadge } = useFeatureAccess();
  
  if (hasAccess(feature)) {
    return children;
  }
  
  if (showLockIcon) {
    const badge = getFeatureBadge(feature);
    return (
      <>
        {fallback}
        {badge && <span>{badge.label}</span>}
      </>
    );
  }
  
  return fallback;
};

export default useFeatureAccess;
