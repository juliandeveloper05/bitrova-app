/**
 * StatsWidget - Productivity Statistics
 * Task List App 2026
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  FadeInRight,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography } from '../constants/theme';

export default function StatsWidget({ tasks = [] }) {
  // Calculate stats
  const totalTasks = tasks.length;
  const completedToday = tasks.filter(t => t.completed).length;
  const pending = totalTasks - completedToday;
  const completionRate = totalTasks > 0 ? Math.round((completedToday / totalTasks) * 100) : 0;
  
  // Get high priority pending
  const highPriorityPending = tasks.filter(t => !t.completed && t.priority === 'high').length;

  return (
    <Animated.View 
      style={styles.container}
      entering={FadeInRight.delay(200).springify()}
    >
      {/* Progress Ring */}
      <View style={styles.progressContainer}>
        <View style={styles.progressRing}>
          <View style={[styles.progressFill, { 
            transform: [{ rotate: `${(completionRate * 3.6)}deg` }] 
          }]} />
          <View style={styles.progressCenter}>
            <Text style={styles.progressPercent}>{completionRate}%</Text>
          </View>
        </View>
      </View>
      
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatItem 
          icon="checkmark-circle"
          value={completedToday}
          label="Completadas"
          color={colors.success}
          delay={100}
        />
        <StatItem 
          icon="time-outline"
          value={pending}
          label="Pendientes"
          color={colors.accentCyan}
          delay={200}
        />
        <StatItem 
          icon="alert-circle"
          value={highPriorityPending}
          label="Urgentes"
          color={colors.priorityHigh}
          delay={300}
        />
      </View>
    </Animated.View>
  );
}

function StatItem({ icon, value, label, color, delay }) {
  return (
    <Animated.View 
      style={styles.statItem}
      entering={FadeInRight.delay(delay).springify()}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassMedium,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  
  progressContainer: {
    marginRight: spacing.lg,
  },
  
  progressRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: colors.glassStrong,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  
  progressFill: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: colors.accentPurple,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  
  progressCenter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  progressPercent: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  
  statsGrid: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  statItem: {
    alignItems: 'center',
  },
  
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
});
