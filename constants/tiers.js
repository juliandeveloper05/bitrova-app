/**
 * Subscription Tiers Configuration
 * TaskList App - Phase 4 Monetization
 * 
 * Defines tier limits, features, and pricing structure
 */

export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free',
    displayName: 'Free Plan',
    price: {
      monthly: 0,
      yearly: 0,
    },
    limits: {
      tasksPerMonth: 25,
      storageMB: 100,
      attachmentsPerTask: 1,
    },
    features: [
      'basic_tasks',
      'categories',
      'dark_mode',
      'notifications',
      'subtasks',
    ],
    color: '#6B7280', // gray
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    displayName: 'Pro Plan',
    price: {
      monthly: 4.99,
      yearly: 49.99, // ~2 months free
    },
    limits: {
      tasksPerMonth: 10000, // Effectively unlimited
      storageMB: 10000, // 10GB
      attachmentsPerTask: 10,
    },
    features: [
      'basic_tasks',
      'categories',
      'dark_mode',
      'notifications',
      'subtasks',
      // Pro features
      'cloud_sync',
      'attachments_unlimited',
      'recurring_tasks',
      'analytics',
      'ai_priorities',
      'pomodoro_advanced',
    ],
    color: '#8B5CF6', // violet
    badge: '⚡',
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    displayName: 'Enterprise Plan',
    price: {
      monthly: 14.99,
      yearly: 149.99,
    },
    limits: {
      tasksPerMonth: -1, // Unlimited
      storageMB: -1, // Unlimited
      attachmentsPerTask: -1,
    },
    features: [
      'basic_tasks',
      'categories',
      'dark_mode',
      'notifications',
      'subtasks',
      'cloud_sync',
      'attachments_unlimited',
      'recurring_tasks',
      'analytics',
      'ai_priorities',
      'pomodoro_advanced',
      // Enterprise features
      'smart_due_dates',
      'weekly_reports',
      'team_workspaces',
      'api_access',
      'priority_support',
    ],
    color: '#F59E0B', // amber
    badge: '👑',
  },
};

/**
 * Feature definitions with display metadata
 */
export const FEATURES = {
  basic_tasks: {
    id: 'basic_tasks',
    name: 'Basic Tasks',
    description: 'Create, edit, and complete tasks',
    minTier: 'free',
  },
  categories: {
    id: 'categories',
    name: 'Categories',
    description: 'Organize tasks by category',
    minTier: 'free',
  },
  dark_mode: {
    id: 'dark_mode',
    name: 'Dark Mode',
    description: 'Switch between light and dark themes',
    minTier: 'free',
  },
  notifications: {
    id: 'notifications',
    name: 'Notifications',
    description: 'Get reminded about due dates',
    minTier: 'free',
  },
  subtasks: {
    id: 'subtasks',
    name: 'Subtasks',
    description: 'Break down tasks into smaller steps',
    minTier: 'free',
  },
  cloud_sync: {
    id: 'cloud_sync',
    name: 'Cloud Sync',
    description: 'Sync across all your devices',
    minTier: 'pro',
  },
  attachments_unlimited: {
    id: 'attachments_unlimited',
    name: 'Unlimited Attachments',
    description: 'Add unlimited files to tasks',
    minTier: 'pro',
  },
  recurring_tasks: {
    id: 'recurring_tasks',
    name: 'Recurring Tasks',
    description: 'Create repeating task patterns',
    minTier: 'pro',
  },
  analytics: {
    id: 'analytics',
    name: 'Advanced Analytics',
    description: 'Detailed productivity insights',
    minTier: 'pro',
  },
  ai_priorities: {
    id: 'ai_priorities',
    name: 'AI Prioritization',
    description: 'Smart task priority suggestions',
    minTier: 'pro',
  },
  pomodoro_advanced: {
    id: 'pomodoro_advanced',
    name: 'Advanced Pomodoro',
    description: 'Extended focus timer features',
    minTier: 'pro',
  },
  smart_due_dates: {
    id: 'smart_due_dates',
    name: 'Smart Due Dates',
    description: 'AI-powered deadline recommendations',
    minTier: 'enterprise',
  },
  weekly_reports: {
    id: 'weekly_reports',
    name: 'Weekly Reports',
    description: 'Email productivity summaries',
    minTier: 'enterprise',
  },
  team_workspaces: {
    id: 'team_workspaces',
    name: 'Team Workspaces',
    description: 'Collaborate with your team',
    minTier: 'enterprise',
  },
  api_access: {
    id: 'api_access',
    name: 'API Access',
    description: 'Integrate with external tools',
    minTier: 'enterprise',
  },
  priority_support: {
    id: 'priority_support',
    name: 'Priority Support',
    description: '24/7 dedicated support',
    minTier: 'enterprise',
  },
};

/**
 * RevenueCat Product IDs
 * These must match the products configured in RevenueCat dashboard
 */
export const REVENUECAT_PRODUCTS = {
  PRO_MONTHLY: 'bitrova_pro_monthly',
  PRO_YEARLY: 'bitrova_pro_yearly',
  ENTERPRISE_MONTHLY: 'bitrova_enterprise_monthly',
  ENTERPRISE_YEARLY: 'bitrova_enterprise_yearly',
};

/**
 * RevenueCat Entitlement IDs
 */
export const ENTITLEMENTS = {
  PRO: 'pro_access',
  ENTERPRISE: 'enterprise_access',
};

/**
 * Helper to get tier by ID
 */
export const getTierById = (tierId) => {
  const tier = Object.values(SUBSCRIPTION_TIERS).find(t => t.id === tierId?.toLowerCase());
  return tier || SUBSCRIPTION_TIERS.FREE;
};

/**
 * Check if a feature is available for a tier
 */
export const isFeatureAvailable = (featureId, tierId) => {
  const tier = getTierById(tierId);
  return tier.features.includes(featureId);
};

/**
 * Get the minimum tier required for a feature
 */
export const getMinTierForFeature = (featureId) => {
  const feature = FEATURES[featureId];
  return feature?.minTier || 'enterprise';
};

/**
 * Compare tiers (returns -1, 0, or 1)
 */
export const compareTiers = (tierA, tierB) => {
  const order = { free: 0, pro: 1, enterprise: 2 };
  const a = order[tierA?.toLowerCase()] ?? 0;
  const b = order[tierB?.toLowerCase()] ?? 0;
  return a - b;
};

export default SUBSCRIPTION_TIERS;
