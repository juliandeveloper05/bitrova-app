/**
 * PaywallModal Component
 * TaskList App - Phase 4 Monetization
 * 
 * Glassmorphism-styled upgrade modal for premium features
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../context/SubscriptionContext';
import { getOfferings, purchasePackage, restorePurchases } from '../services/subscriptionService';
import { SUBSCRIPTION_TIERS, FEATURES } from '../constants/tiers';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PaywallModal = ({ visible, onClose, triggerFeature = null }) => {
  const { theme, isDarkMode } = useTheme();
  const { tier, isLegacy } = useSubscription();
  
  const [packages, setPackages] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(null);

  // Load available packages
  useEffect(() => {
    if (visible) {
      loadPackages();
    }
  }, [visible]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const offerings = await getOfferings();
      setPackages(offerings);
    } catch (err) {
      console.error('Failed to load packages:', err);
      setError('Failed to load subscription options');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageToPurchase) => {
    try {
      setPurchasing(true);
      setError(null);
      
      const result = await purchasePackage(packageToPurchase);
      
      if (result.success) {
        onClose({ success: true, tier: result.tier });
      } else if (result.cancelled) {
        // User cancelled, do nothing
      }
    } catch (err) {
      console.error('Purchase failed:', err);
      setError(err.message || 'Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setPurchasing(true);
      setError(null);
      
      const result = await restorePurchases();
      
      if (result.success && result.tier !== 'free') {
        onClose({ success: true, tier: result.tier, restored: true });
      } else {
        setError('No previous purchases found');
      }
    } catch (err) {
      console.error('Restore failed:', err);
      setError(err.message || 'Failed to restore purchases');
    } finally {
      setPurchasing(false);
    }
  };

  const getFeatureToHighlight = () => {
    if (triggerFeature && FEATURES[triggerFeature]) {
      return FEATURES[triggerFeature];
    }
    return null;
  };

  const highlightedFeature = getFeatureToHighlight();

  const proFeatures = [
    { icon: 'cloud-outline', text: 'Cloud Sync Across Devices' },
    { icon: 'attach-outline', text: 'Unlimited Attachments' },
    { icon: 'repeat-outline', text: 'Recurring Tasks' },
    { icon: 'analytics-outline', text: 'Advanced Analytics' },
    { icon: 'sparkles-outline', text: 'AI Task Prioritization' },
    { icon: 'timer-outline', text: 'Advanced Pomodoro' },
  ];

  const renderPackageButton = (pkg, isRecommended = false) => (
    <TouchableOpacity
      key={pkg.identifier}
      style={[
        styles.packageButton,
        isRecommended && styles.recommendedPackage,
        { borderColor: theme.border },
      ]}
      onPress={() => handlePurchase(pkg)}
      disabled={purchasing}
    >
      {isRecommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>BEST VALUE</Text>
        </View>
      )}
      <Text style={[styles.packageTitle, { color: theme.text }]}>
        {pkg.product?.title || 'Pro Plan'}
      </Text>
      <Text style={[styles.packagePrice, { color: theme.primary }]}>
        {pkg.product?.priceString || '$4.99'}
      </Text>
      <Text style={[styles.packagePeriod, { color: theme.textSecondary }]}>
        {pkg.packageType === 'ANNUAL' ? '/year' : '/month'}
      </Text>
      {pkg.packageType === 'ANNUAL' && (
        <Text style={[styles.savingsText, { color: '#22C55E' }]}>
          Save 17%
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => onClose(null)}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={styles.blurContainer} tint={isDarkMode ? 'dark' : 'light'}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface + 'F5' }]}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => onClose(null)}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Pro Badge */}
              <LinearGradient
                colors={['#8B5CF6', '#6366F1']}
                style={styles.proBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="flash" size={32} color="#FFF" />
              </LinearGradient>

              <Text style={[styles.title, { color: theme.text }]}>
                Upgrade to Pro
              </Text>
              
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Unlock the full power of Bitrova
              </Text>

              {/* Trigger Feature Highlight */}
              {highlightedFeature && (
                <View style={[styles.featureHighlight, { backgroundColor: theme.primary + '20' }]}>
                  <Ionicons name="lock-open-outline" size={20} color={theme.primary} />
                  <Text style={[styles.featureHighlightText, { color: theme.text }]}>
                    Unlock <Text style={{ fontWeight: 'bold' }}>{highlightedFeature.name}</Text>
                  </Text>
                </View>
              )}

              {/* Features List */}
              <View style={styles.featuresList}>
                {proFeatures.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <View style={[styles.checkCircle, { backgroundColor: '#22C55E20' }]}>
                      <Ionicons name="checkmark" size={16} color="#22C55E" />
                    </View>
                    <Text style={[styles.featureText, { color: theme.text }]}>
                      {feature.text}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Loading State */}
              {loading && (
                <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
              )}

              {/* Package Options */}
              {!loading && packages.length > 0 && (
                <View style={styles.packagesContainer}>
                  {packages.map((pkg, index) => 
                    renderPackageButton(pkg, pkg.packageType === 'ANNUAL')
                  )}
                </View>
              )}

              {/* Fallback buttons if no packages loaded */}
              {!loading && packages.length === 0 && (
                <View style={styles.packagesContainer}>
                  <TouchableOpacity
                    style={[styles.packageButton, styles.recommendedPackage, { borderColor: theme.border }]}
                    disabled={Platform.OS === 'web'}
                  >
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>BEST VALUE</Text>
                    </View>
                    <Text style={[styles.packageTitle, { color: theme.text }]}>Pro Yearly</Text>
                    <Text style={[styles.packagePrice, { color: theme.primary }]}>$49.99</Text>
                    <Text style={[styles.packagePeriod, { color: theme.textSecondary }]}>/year</Text>
                    <Text style={[styles.savingsText, { color: '#22C55E' }]}>Save 17%</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.packageButton, { borderColor: theme.border }]}
                    disabled={Platform.OS === 'web'}
                  >
                    <Text style={[styles.packageTitle, { color: theme.text }]}>Pro Monthly</Text>
                    <Text style={[styles.packagePrice, { color: theme.primary }]}>$4.99</Text>
                    <Text style={[styles.packagePeriod, { color: theme.textSecondary }]}>/month</Text>
                  </TouchableOpacity>
                </View>
              )}

              {Platform.OS === 'web' && (
                <Text style={[styles.webNotice, { color: theme.textSecondary }]}>
                  In-app purchases are only available on mobile devices
                </Text>
              )}

              {/* Error Message */}
              {error && (
                <Text style={styles.errorText}>{error}</Text>
              )}

              {/* Restore Purchases */}
              <TouchableOpacity
                style={styles.restoreButton}
                onPress={handleRestore}
                disabled={purchasing}
              >
                <Text style={[styles.restoreText, { color: theme.textSecondary }]}>
                  Restore Purchases
                </Text>
              </TouchableOpacity>

              {/* Terms */}
              <Text style={[styles.terms, { color: theme.textSecondary }]}>
                Subscription automatically renews unless canceled at least 24 hours before the end of the current period.
              </Text>
            </ScrollView>

            {/* Purchase Loading Overlay */}
            {purchasing && (
              <View style={styles.purchasingOverlay}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={styles.purchasingText}>Processing...</Text>
              </View>
            )}
          </View>
        </BlurView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  proBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  featureHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  featureHighlightText: {
    fontSize: 15,
  },
  featuresList: {
    width: '100%',
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
  },
  packagesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    width: '100%',
  },
  packageButton: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  recommendedPackage: {
    borderColor: '#8B5CF6',
    position: 'relative',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recommendedText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  packageTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  packagePeriod: {
    fontSize: 12,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  loader: {
    marginVertical: 24,
  },
  webNotice: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  restoreButton: {
    padding: 12,
  },
  restoreText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  terms: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  purchasingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  purchasingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 12,
  },
});

export default PaywallModal;
