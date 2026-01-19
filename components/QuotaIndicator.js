/**
 * QuotaIndicator Component
 * TaskList App - Phase 4 Monetization
 * 
 * Visual progress indicators for usage quotas
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSubscription } from '../context/SubscriptionContext';
import { getQuotaStatus } from '../services/quotaService';

/**
 * Circular progress indicator for task quota
 */
export const TaskQuotaIndicator = ({ size = 48, showLabel = true }) => {
  const { theme } = useTheme();
  const { usage, getCurrentTier, getRemainingTasks } = useSubscription();
  
  const tier = getCurrentTier();
  const limit = tier.limits.tasksPerMonth;
  const current = usage.tasksThisMonth;
  const remaining = getRemainingTasks();
  
  // Unlimited
  if (limit === -1) {
    return showLabel ? (
      <View style={styles.unlimitedContainer}>
        <Ionicons name="infinite" size={20} color={theme.primary} />
        <Text style={[styles.unlimitedText, { color: theme.textSecondary }]}>
          Unlimited
        </Text>
      </View>
    ) : null;
  }
  
  const percent = Math.min(100, Math.round((current / limit) * 100));
  const status = getQuotaStatus(percent);
  
  // SVG-based circular progress
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  
  return (
    <View style={styles.quotaContainer}>
      <View style={[styles.circularContainer, { width: size, height: size }]}>
        {/* Background circle */}
        <View 
          style={[
            styles.circleBackground, 
            { 
              width: size - 8, 
              height: size - 8, 
              borderRadius: (size - 8) / 2,
              borderColor: theme.border,
            }
          ]} 
        />
        {/* Progress indicator (simplified, using View-based approach) */}
        <View 
          style={[
            styles.progressIndicator,
            { 
              width: size - 8, 
              height: size - 8, 
              borderRadius: (size - 8) / 2,
              borderColor: status.color,
              borderWidth: 3,
              borderTopColor: percent > 75 ? status.color : 'transparent',
              borderRightColor: percent > 50 ? status.color : 'transparent',
              borderBottomColor: percent > 25 ? status.color : 'transparent',
              borderLeftColor: percent > 0 ? status.color : 'transparent',
              transform: [{ rotate: '-45deg' }],
            }
          ]} 
        />
        {/* Center text */}
        <View style={styles.centerContent}>
          <Text style={[styles.percentText, { color: status.color, fontSize: size * 0.28 }]}>
            {percent}%
          </Text>
        </View>
      </View>
      
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.usageText, { color: theme.text }]}>
            {current} / {limit}
          </Text>
          <Text style={[styles.labelText, { color: theme.textSecondary }]}>
            tasks this month
          </Text>
        </View>
      )}
    </View>
  );
};

/**
 * Linear progress bar for storage quota
 */
export const StorageQuotaIndicator = ({ showLabel = true }) => {
  const { theme } = useTheme();
  const { usage, getCurrentTier, getStorageUsagePercent } = useSubscription();
  
  const tier = getCurrentTier();
  const limitMB = tier.limits.storageMB;
  const currentMB = usage.storageMB;
  
  // Unlimited
  if (limitMB === -1) {
    return showLabel ? (
      <View style={styles.storageContainer}>
        <View style={styles.storageHeader}>
          <Ionicons name="cloud-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.storageLabel, { color: theme.textSecondary }]}>
            Storage
          </Text>
        </View>
        <View style={styles.unlimitedRow}>
          <Ionicons name="infinite" size={16} color={theme.primary} />
          <Text style={[styles.unlimitedText, { color: theme.textSecondary }]}>
            Unlimited
          </Text>
        </View>
      </View>
    ) : null;
  }
  
  const percent = getStorageUsagePercent();
  const status = getQuotaStatus(percent);
  
  return (
    <View style={styles.storageContainer}>
      {showLabel && (
        <View style={styles.storageHeader}>
          <Ionicons name="cloud-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.storageLabel, { color: theme.textSecondary }]}>
            Storage
          </Text>
          <Text style={[styles.storageValue, { color: theme.text }]}>
            {currentMB.toFixed(1)} / {limitMB} MB
          </Text>
        </View>
      )}
      
      <View style={[styles.progressBarBackground, { backgroundColor: theme.border }]}>
        <View 
          style={[
            styles.progressBarFill,
            { 
              width: `${percent}%`,
              backgroundColor: status.color,
            }
          ]}
        />
      </View>
      
      {status.status !== 'ok' && (
        <Text style={[styles.warningText, { color: status.color }]}>
          {status.message}
        </Text>
      )}
    </View>
  );
};

/**
 * Combined quota summary card for Settings
 */
export const QuotaSummaryCard = () => {
  const { theme } = useTheme();
  const { getCurrentTier, tier, isLegacy } = useSubscription();
  
  const tierConfig = getCurrentTier();
  
  return (
    <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          Usage
        </Text>
        <View style={[styles.tierBadge, { backgroundColor: tierConfig.color + '20' }]}>
          <Text style={[styles.tierBadgeText, { color: tierConfig.color }]}>
            {tierConfig.badge} {tierConfig.name}
            {isLegacy && ' (Legacy)'}
          </Text>
        </View>
      </View>
      
      <View style={styles.quotaRow}>
        <TaskQuotaIndicator size={56} showLabel={true} />
      </View>
      
      <View style={styles.divider} />
      
      <StorageQuotaIndicator showLabel={true} />
    </View>
  );
};

const styles = StyleSheet.create({
  quotaContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  circularContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circleBackground: {
    position: 'absolute',
    borderWidth: 3,
  },
  progressIndicator: {
    position: 'absolute',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    fontWeight: 'bold',
  },
  labelContainer: {
    flex: 1,
  },
  usageText: {
    fontSize: 16,
    fontWeight: '600',
  },
  labelText: {
    fontSize: 12,
  },
  unlimitedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unlimitedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unlimitedText: {
    fontSize: 14,
  },
  storageContainer: {
    width: '100%',
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  storageLabel: {
    fontSize: 14,
    flex: 1,
  },
  storageValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  warningText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quotaRow: {
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 12,
    opacity: 0.3,
  },
});

export default QuotaSummaryCard;
