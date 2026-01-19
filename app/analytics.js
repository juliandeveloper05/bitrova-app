/**
 * Analytics Dashboard Screen
 * TaskList App - Phase 4 Monetization
 * 
 * Advanced productivity insights with charts and metrics
 */

import React, { useState, useContext, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '../context/ThemeContext';
import { TaskContext } from '../context/TaskContext';
import { useStats } from '../context/StatsContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import GlassCard from '../components/GlassCard';
import ProductivityChart from '../components/analytics/ProductivityChart';
import CategoryBreakdown from '../components/analytics/CategoryBreakdown';
import PaywallModal from '../components/PaywallModal';

const TIME_RANGES = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'quarter', label: 'Quarter' },
];

export default function AnalyticsScreen() {
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();
  const { tasks, getStats } = useContext(TaskContext);
  const { getWeeklyStats, getMonthlyStats, getTodayStats } = useStats();
  const { isPro, tier } = useSubscription();
  const { hasAccess } = useFeatureAccess();
  
  const [timeRange, setTimeRange] = useState('week');
  const [refreshing, setRefreshing] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Check access
  const canViewAnalytics = hasAccess('analytics');

  // Computed stats
  const taskStats = useMemo(() => getStats(), [tasks]);
  const weeklyStats = useMemo(() => getWeeklyStats(), [getWeeklyStats]);
  const monthlyStats = useMemo(() => getMonthlyStats(), [getMonthlyStats]);
  const todayStats = useMemo(() => getTodayStats(), [getTodayStats]);

  // Productivity score calculation
  const productivityScore = useMemo(() => {
    const { tasksCompleted, focusMinutes } = weeklyStats.totals;
    // Simple scoring: 1 point per task, 0.5 points per 25 min focus
    const score = tasksCompleted + Math.floor(focusMinutes / 50);
    return Math.min(100, score * 5); // Cap at 100
  }, [weeklyStats]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshing(false);
  }, []);

  const StatCard = ({ icon, label, value, color, subValue }) => (
    <GlassCard style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
      {subValue && (
        <Text style={[styles.statSubValue, { color: theme.textSecondary }]}>{subValue}</Text>
      )}
    </GlassCard>
  );

  // Show upgrade prompt for non-Pro users
  if (!canViewAnalytics) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Analytics</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.lockedContainer}>
          <LinearGradient
            colors={['#8B5CF6', '#6366F1']}
            style={styles.lockedIcon}
          >
            <Ionicons name="lock-closed" size={48} color="#FFF" />
          </LinearGradient>
          
          <Text style={[styles.lockedTitle, { color: theme.text }]}>
            Unlock Analytics
          </Text>
          <Text style={[styles.lockedDescription, { color: theme.textSecondary }]}>
            Get detailed insights into your productivity patterns, track trends, and optimize your workflow.
          </Text>
          
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => setShowPaywall(true)}
          >
            <LinearGradient
              colors={['#8B5CF6', '#6366F1']}
              style={styles.upgradeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="flash" size={20} color="#FFF" />
              <Text style={styles.upgradeText}>Upgrade to Pro</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <PaywallModal
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          triggerFeature="analytics"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {TIME_RANGES.map((range) => (
            <TouchableOpacity
              key={range.id}
              style={[
                styles.timeRangeButton,
                timeRange === range.id && { backgroundColor: theme.primary + '20' },
              ]}
              onPress={() => setTimeRange(range.id)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  { color: timeRange === range.id ? theme.primary : theme.textSecondary },
                ]}
              >
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Productivity Score */}
        <GlassCard style={styles.scoreCard}>
          <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>
            Productivity Score
          </Text>
          <Text style={[styles.scoreValue, { color: theme.primary }]}>
            {productivityScore}
          </Text>
          <View style={styles.scoreProgressContainer}>
            <View 
              style={[
                styles.scoreProgress,
                { 
                  width: `${productivityScore}%`,
                  backgroundColor: theme.primary,
                }
              ]}
            />
          </View>
          <Text style={[styles.scoreHint, { color: theme.textSecondary }]}>
            Based on completed tasks and focus time
          </Text>
        </GlassCard>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="checkmark-done"
            label="Completed"
            value={taskStats.completed}
            color="#22C55E"
          />
          <StatCard
            icon="hourglass-outline"
            label="Pending"
            value={taskStats.pending}
            color="#F59E0B"
          />
          <StatCard
            icon="flame"
            label="Streak"
            value={`${monthlyStats.currentStreak}d`}
            color="#EF4444"
          />
          <StatCard
            icon="time"
            label="Focus"
            value={`${Math.round(weeklyStats.totals.focusMinutes / 60)}h`}
            color="#8B5CF6"
          />
        </View>

        {/* Weekly Activity Chart */}
        <GlassCard style={styles.chartCard}>
          <ProductivityChart
            data={weeklyStats.days}
            title="Tasks Completed"
            valueKey="tasksCompleted"
          />
        </GlassCard>

        {/* Focus Time Chart */}
        <GlassCard style={styles.chartCard}>
          <ProductivityChart
            data={weeklyStats.days}
            title="Focus Minutes"
            valueKey="focusMinutes"
            accentColor="#8B5CF6"
          />
        </GlassCard>

        {/* Category Breakdown */}
        <GlassCard style={styles.chartCard}>
          <CategoryBreakdown tasks={tasks} />
        </GlassCard>

        {/* Monthly Summary */}
        <GlassCard style={styles.summaryCard}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>
            {monthlyStats.monthName} Summary
          </Text>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {monthlyStats.tasksCompleted}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Tasks Done
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {monthlyStats.activeDays}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Active Days
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {monthlyStats.maxStreak}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Best Streak
              </Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  scoreProgressContainer: {
    width: '80%',
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  scoreProgress: {
    height: '100%',
    borderRadius: 4,
  },
  scoreHint: {
    fontSize: 12,
    marginTop: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statSubValue: {
    fontSize: 11,
    marginTop: 2,
  },
  chartCard: {
    marginBottom: 16,
    padding: 16,
  },
  summaryCard: {
    padding: 20,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  lockedIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  lockedDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  upgradeButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  upgradeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
