/**
 * Stats Screen - Weekly/Monthly Statistics
 * Task List App 2026
 */

import React, { useState, useContext, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import WeeklyChart from '../components/WeeklyChart';
import StatsSummaryCard from '../components/StatsSummaryCard';
import { useStats } from '../context/StatsContext';
import { TaskContext } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, typography } from '../constants/theme';

// Safe haptics wrapper
const safeHaptics = {
  impact: (style) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  },
};

export default function StatsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { getWeeklyStats, getMonthlyStats, getTodayStats } = useStats();
  const { tasks, recurringSeries } = useContext(TaskContext);
  const [chartMetric, setChartMetric] = useState('tasksCompleted');
  
  const weeklyStats = getWeeklyStats();
  const monthlyStats = getMonthlyStats();
  const todayStats = getTodayStats();

  // Calculate recurring tasks statistics
  const recurringStats = useMemo(() => {
    const recurringTasks = tasks.filter(t => t.isRecurring);
    const completed = recurringTasks.filter(t => t.completed).length;
    const skipped = recurringTasks.filter(t => t.skipped).length;
    const pending = recurringTasks.filter(t => !t.completed && !t.skipped).length;
    const total = recurringTasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      seriesCount: recurringSeries.length,
      totalInstances: total,
      completed,
      pending,
      skipped,
      completionRate,
    };
  }, [tasks, recurringSeries]);

  const chartMetrics = [
    { key: 'tasksCompleted', label: 'Tareas', icon: 'checkmark-circle', color: colors.success },
    { key: 'pomodoroSessions', label: 'Pomodoros', icon: 'time', color: colors.accentPurple },
    { key: 'focusMinutes', label: 'Minutos', icon: 'flash', color: colors.accentCyan },
  ];

  const currentMetric = chartMetrics.find(m => m.key === chartMetric);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Header */}
      <Animated.View 
        style={styles.header}
        entering={FadeInUp.springify()}
      >
        <Pressable 
          style={[styles.backButton, { backgroundColor: colors.glassMedium }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>📊</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Estadísticas</Text>
        </View>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Today Summary */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(100).springify()}
        >
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            HOY
          </Text>
          <View style={styles.todayGrid}>
            <StatsSummaryCard
              icon="checkmark-circle"
              value={todayStats.tasksCompleted}
              label="Tareas completadas"
              color={colors.success}
              delay={150}
            />
            <View style={styles.todayRow}>
              <View style={styles.todayHalf}>
                <StatsSummaryCard
                  icon="time"
                  value={todayStats.pomodoroSessions}
                  label="Pomodoros"
                  color={colors.accentPurple}
                  delay={200}
                />
              </View>
              <View style={styles.todayHalf}>
                <StatsSummaryCard
                  icon="flash"
                  value={todayStats.focusMinutes}
                  label="Min. enfocado"
                  color={colors.accentCyan}
                  delay={250}
                />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Weekly Chart Section */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(300).springify()}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              ESTA SEMANA
            </Text>
            <View style={styles.metricTabs}>
              {chartMetrics.map((metric) => (
                <Pressable
                  key={metric.key}
                  style={[
                    styles.metricTab,
                    { backgroundColor: chartMetric === metric.key ? metric.color + '30' : 'transparent' }
                  ]}
                  onPress={() => {
                    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
                    setChartMetric(metric.key);
                  }}
                >
                  <Ionicons 
                    name={metric.icon} 
                    size={16} 
                    color={chartMetric === metric.key ? metric.color : colors.textTertiary} 
                  />
                </Pressable>
              ))}
            </View>
          </View>
          
          <WeeklyChart 
            data={weeklyStats.days} 
            dataKey={chartMetric}
            color={currentMetric.color}
          />
          
          {/* Weekly Totals */}
          <View style={styles.weeklyTotals}>
            <View style={[styles.totalCard, { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder }]}>
              <Text style={[styles.totalValue, { color: colors.success }]}>
                {weeklyStats.totals.tasksCompleted}
              </Text>
              <Text style={[styles.totalLabel, { color: colors.textTertiary }]}>Tareas</Text>
            </View>
            <View style={[styles.totalCard, { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder }]}>
              <Text style={[styles.totalValue, { color: colors.accentPurple }]}>
                {weeklyStats.totals.pomodoroSessions}
              </Text>
              <Text style={[styles.totalLabel, { color: colors.textTertiary }]}>Pomodoros</Text>
            </View>
            <View style={[styles.totalCard, { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder }]}>
              <Text style={[styles.totalValue, { color: colors.accentCyan }]}>
                {Math.round(weeklyStats.totals.focusMinutes / 60 * 10) / 10}h
              </Text>
              <Text style={[styles.totalLabel, { color: colors.textTertiary }]}>Enfocado</Text>
            </View>
          </View>
        </Animated.View>

        {/* Monthly Summary */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(400).springify()}
        >
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {monthlyStats.monthName.toUpperCase()} {monthlyStats.year}
          </Text>
          
          <View style={[styles.monthlyCard, { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder }]}>
            <View style={styles.monthlyRow}>
              <View style={styles.monthlyItem}>
                <Text style={[styles.monthlyValue, { color: colors.success }]}>
                  {monthlyStats.tasksCompleted}
                </Text>
                <Text style={[styles.monthlyLabel, { color: colors.textTertiary }]}>
                  Tareas completadas
                </Text>
              </View>
              <View style={[styles.monthlyDivider, { backgroundColor: colors.glassBorder }]} />
              <View style={styles.monthlyItem}>
                <Text style={[styles.monthlyValue, { color: colors.accentPurple }]}>
                  {monthlyStats.pomodoroSessions}
                </Text>
                <Text style={[styles.monthlyLabel, { color: colors.textTertiary }]}>
                  Sesiones Pomodoro
                </Text>
              </View>
            </View>
            
            <View style={[styles.monthlyDividerH, { backgroundColor: colors.glassBorder }]} />
            
            <View style={styles.monthlyRow}>
              <View style={styles.monthlyItem}>
                <Text style={[styles.monthlyValue, { color: colors.accentCyan }]}>
                  {Math.round(monthlyStats.focusMinutes / 60 * 10) / 10}h
                </Text>
                <Text style={[styles.monthlyLabel, { color: colors.textTertiary }]}>
                  Tiempo enfocado
                </Text>
              </View>
              <View style={[styles.monthlyDivider, { backgroundColor: colors.glassBorder }]} />
              <View style={styles.monthlyItem}>
                <Text style={[styles.monthlyValue, { color: colors.warning }]}>
                  {monthlyStats.activeDays}/{monthlyStats.daysInMonth}
                </Text>
                <Text style={[styles.monthlyLabel, { color: colors.textTertiary }]}>
                  Días activos
                </Text>
              </View>
            </View>
          </View>

          {/* Streak Card */}
          <Animated.View 
            style={[styles.streakCard, { backgroundColor: colors.accentPurple + '15', borderColor: colors.accentPurple + '30' }]}
            entering={FadeInUp.delay(500).springify()}
          >
            <View style={[styles.streakIcon, { backgroundColor: colors.accentPurple + '30' }]}>
              <Text style={styles.streakEmoji}>🔥</Text>
            </View>
            <View style={styles.streakContent}>
              <Text style={[styles.streakValue, { color: colors.textPrimary }]}>
                {monthlyStats.currentStreak} días
              </Text>
              <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>
                Racha actual
              </Text>
            </View>
            <View style={styles.streakBest}>
              <Text style={[styles.streakBestLabel, { color: colors.textTertiary }]}>Mejor</Text>
              <Text style={[styles.streakBestValue, { color: colors.accentPurple }]}>
                {monthlyStats.maxStreak}
              </Text>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Recurring Tasks Stats */}
        {recurringStats.seriesCount > 0 && (
          <Animated.View 
            style={styles.section}
            entering={FadeInUp.delay(500).springify()}
          >
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              TAREAS RECURRENTES
            </Text>
            
            <View style={[styles.recurringCard, { backgroundColor: colors.accentCyan + '10', borderColor: colors.accentCyan + '30' }]}>
              <View style={styles.recurringHeader}>
                <View style={[styles.recurringIconContainer, { backgroundColor: colors.accentCyan + '20' }]}>
                  <Ionicons name="repeat" size={24} color={colors.accentCyan} />
                </View>
                <View style={styles.recurringHeaderText}>
                  <Text style={[styles.recurringSeriesCount, { color: colors.textPrimary }]}>
                    {recurringStats.seriesCount} serie{recurringStats.seriesCount !== 1 ? 's' : ''}
                  </Text>
                  <Text style={[styles.recurringInstanceCount, { color: colors.textSecondary }]}>
                    {recurringStats.totalInstances} instancias totales
                  </Text>
                </View>
                <View style={styles.completionCircle}>
                  <Text style={[styles.completionPercentage, { color: colors.accentCyan }]}>
                    {recurringStats.completionRate}%
                  </Text>
                </View>
              </View>
              
              <View style={[styles.recurringBreakdown]}>
                <View style={[styles.breakdownItem, { backgroundColor: colors.success + '15' }]}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={[styles.breakdownValue, { color: colors.success }]}>
                    {recurringStats.completed}
                  </Text>
                  <Text style={[styles.breakdownLabel, { color: colors.textTertiary }]}>
                    completadas
                  </Text>
                </View>
                
                <View style={[styles.breakdownItem, { backgroundColor: colors.warning + '15' }]}>
                  <Ionicons name="time-outline" size={16} color={colors.warning} />
                  <Text style={[styles.breakdownValue, { color: colors.warning }]}>
                    {recurringStats.pending}
                  </Text>
                  <Text style={[styles.breakdownLabel, { color: colors.textTertiary }]}>
                    pendientes
                  </Text>
                </View>
                
                {recurringStats.skipped > 0 && (
                  <View style={[styles.breakdownItem, { backgroundColor: colors.textTertiary + '15' }]}>
                    <Ionicons name="play-skip-forward" size={16} color={colors.textTertiary} />
                    <Text style={[styles.breakdownValue, { color: colors.textSecondary }]}>
                      {recurringStats.skipped}
                    </Text>
                    <Text style={[styles.breakdownLabel, { color: colors.textTertiary }]}>
                      saltadas
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Spacer */}
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </View>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  headerEmoji: {
    fontSize: 24,
  },

  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },

  scrollContent: {
    flex: 1,
  },

  scrollContainer: {
    paddingHorizontal: spacing.lg,
  },

  section: {
    marginBottom: spacing.xl,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },

  metricTabs: {
    flexDirection: 'row',
    gap: spacing.xs,
  },

  metricTab: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  todayGrid: {
    gap: spacing.md,
  },

  todayRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  todayHalf: {
    flex: 1,
  },

  weeklyTotals: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },

  totalCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },

  totalValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },

  totalLabel: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },

  monthlyCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.xl,
  },

  monthlyRow: {
    flexDirection: 'row',
  },

  monthlyItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },

  monthlyValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },

  monthlyLabel: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  monthlyDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },

  monthlyDividerH: {
    height: 1,
    marginVertical: spacing.md,
  },

  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    gap: spacing.md,
  },

  streakIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  streakEmoji: {
    fontSize: 24,
  },

  streakContent: {
    flex: 1,
  },

  streakValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },

  streakLabel: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },

  streakBest: {
    alignItems: 'center',
  },

  streakBestLabel: {
    fontSize: typography.fontSize.xs,
  },

  streakBestValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },

  // Recurring stats styles
  recurringCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },

  recurringHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  recurringIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  recurringHeaderText: {
    flex: 1,
  },

  recurringSeriesCount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },

  recurringInstanceCount: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },

  completionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  completionPercentage: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },

  recurringBreakdown: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  breakdownItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: 4,
  },

  breakdownValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },

  breakdownLabel: {
    fontSize: typography.fontSize.xs,
  },
});
