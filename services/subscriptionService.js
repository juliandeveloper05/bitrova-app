/**
 * Subscription Service
 * TaskList App - Phase 4 Monetization
 * 
 * RevenueCat SDK integration for in-app purchases
 */

import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { REVENUECAT_PRODUCTS, ENTITLEMENTS, getTierById } from '../constants/tiers';

// RevenueCat API Keys (replace with your actual keys from RevenueCat dashboard)
const REVENUECAT_API_KEY_IOS = 'YOUR_REVENUECAT_IOS_API_KEY';
const REVENUECAT_API_KEY_ANDROID = 'YOUR_REVENUECAT_ANDROID_API_KEY';

let isInitialized = false;

/**
 * Initialize RevenueCat SDK
 * Call this once when the app starts (e.g., in App.js or _layout.js)
 */
export const initializeRevenueCat = async (userId = null) => {
  try {
    if (isInitialized) {
      console.log('RevenueCat already initialized');
      return;
    }

    // Skip on web platform
    if (Platform.OS === 'web') {
      console.log('RevenueCat not supported on web');
      return;
    }

    const apiKey = Platform.OS === 'ios' 
      ? REVENUECAT_API_KEY_IOS 
      : REVENUECAT_API_KEY_ANDROID;

    // Check if API key is configured
    if (apiKey.startsWith('YOUR_')) {
      console.warn('RevenueCat API keys not configured. Subscription features will be simulated.');
      return;
    }

    await Purchases.configure({ apiKey });

    // If user ID provided, identify the user
    if (userId) {
      await Purchases.logIn(userId);
    }

    isInitialized = true;
    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
  }
};

/**
 * Identify user in RevenueCat (call after login)
 */
export const identifyUser = async (userId) => {
  try {
    if (Platform.OS === 'web') return;
    
    const { customerInfo } = await Purchases.logIn(userId);
    await syncSubscriptionToSupabase(customerInfo);
    return customerInfo;
  } catch (error) {
    console.error('Failed to identify user in RevenueCat:', error);
    throw error;
  }
};

/**
 * Get current customer info from RevenueCat
 */
export const getCustomerInfo = async () => {
  try {
    if (Platform.OS === 'web') {
      // Return mock data for web
      return getMockCustomerInfo();
    }
    
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Failed to get customer info:', error);
    return getMockCustomerInfo();
  }
};

/**
 * Get available subscription packages
 */
export const getOfferings = async () => {
  try {
    if (Platform.OS === 'web') {
      return getMockOfferings();
    }

    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages || [];
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return [];
  }
};

/**
 * Purchase a subscription package
 */
export const purchasePackage = async (packageToPurchase) => {
  try {
    if (Platform.OS === 'web') {
      throw new Error('Purchases not supported on web. Please use mobile app.');
    }

    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    
    // Sync to Supabase
    await syncSubscriptionToSupabase(customerInfo);
    
    return {
      success: true,
      customerInfo,
      tier: getActiveTier(customerInfo),
    };
  } catch (error) {
    if (error.userCancelled) {
      return { success: false, cancelled: true };
    }
    console.error('Purchase failed:', error);
    throw error;
  }
};

/**
 * Restore previous purchases
 */
export const restorePurchases = async () => {
  try {
    if (Platform.OS === 'web') {
      throw new Error('Restore not supported on web.');
    }

    const customerInfo = await Purchases.restorePurchases();
    
    // Sync to Supabase
    await syncSubscriptionToSupabase(customerInfo);
    
    return {
      success: true,
      customerInfo,
      tier: getActiveTier(customerInfo),
    };
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    throw error;
  }
};

/**
 * Determine active subscription tier from customer info
 */
export const getActiveTier = (customerInfo) => {
  if (!customerInfo) return 'free';
  
  const { entitlements } = customerInfo;
  
  // Check for Enterprise first (highest tier)
  if (entitlements.active[ENTITLEMENTS.ENTERPRISE]) {
    return 'enterprise';
  }
  
  // Check for Pro
  if (entitlements.active[ENTITLEMENTS.PRO]) {
    return 'pro';
  }
  
  return 'free';
};

/**
 * Check if user has active subscription
 */
export const hasActiveSubscription = (customerInfo) => {
  if (!customerInfo) return false;
  
  const tier = getActiveTier(customerInfo);
  return tier !== 'free';
};

/**
 * Sync subscription status to Supabase profile
 */
export const syncSubscriptionToSupabase = async (customerInfo) => {
  try {
    if (!isSupabaseConfigured()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const tier = getActiveTier(customerInfo);
    const entitlementInfo = customerInfo.entitlements.active[ENTITLEMENTS.PRO] 
      || customerInfo.entitlements.active[ENTITLEMENTS.ENTERPRISE];

    const expiresAt = entitlementInfo?.expirationDate 
      ? new Date(entitlementInfo.expirationDate).toISOString()
      : null;

    const { error } = await supabase
      .from('profiles')
      .update({
        tier,
        sub_status: entitlementInfo ? 'active' : 'none',
        revenue_cat_id: customerInfo.originalAppUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) throw error;
    
    console.log('Subscription synced to Supabase:', { tier });
  } catch (error) {
    console.error('Failed to sync subscription to Supabase:', error);
  }
};

/**
 * Listen for subscription changes
 */
export const addSubscriptionListener = (callback) => {
  if (Platform.OS === 'web') return () => {};
  
  const listener = Purchases.addCustomerInfoUpdateListener((customerInfo) => {
    const tier = getActiveTier(customerInfo);
    callback({ customerInfo, tier });
  });
  
  return listener;
};

/**
 * Log out user from RevenueCat
 */
export const logoutUser = async () => {
  try {
    if (Platform.OS === 'web') return;
    await Purchases.logOut();
    isInitialized = false;
  } catch (error) {
    console.error('Failed to logout from RevenueCat:', error);
  }
};

// ============================================
// Mock data for web/development
// ============================================

const getMockCustomerInfo = () => ({
  entitlements: {
    active: {},
    all: {},
  },
  originalAppUserId: 'mock_user',
  managementURL: null,
});

const getMockOfferings = () => [
  {
    identifier: '$rc_monthly',
    packageType: 'MONTHLY',
    product: {
      identifier: REVENUECAT_PRODUCTS.PRO_MONTHLY,
      title: 'Pro Monthly',
      description: 'Full access to Pro features',
      priceString: '$4.99',
      price: 4.99,
    },
  },
  {
    identifier: '$rc_annual',
    packageType: 'ANNUAL',
    product: {
      identifier: REVENUECAT_PRODUCTS.PRO_YEARLY,
      title: 'Pro Yearly',
      description: 'Full access to Pro features - Best Value',
      priceString: '$49.99',
      price: 49.99,
    },
  },
];

export default {
  initializeRevenueCat,
  identifyUser,
  getCustomerInfo,
  getOfferings,
  purchasePackage,
  restorePurchases,
  getActiveTier,
  hasActiveSubscription,
  syncSubscriptionToSupabase,
  addSubscriptionListener,
  logoutUser,
};
