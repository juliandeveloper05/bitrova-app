/**
 * Pomodoro Screen - Dedicated Timer Screen
 * Task List App 2026
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import PomodoroTimer from '../components/PomodoroTimer';
import { usePomodoro } from '../context/PomodoroContext';
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

export default function PomodoroScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { sessionsCompleted, resetAll } = usePomodoro();

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
          <Text style={styles.headerEmoji}>🍅</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Pomodoro</Text>
        </View>
        <Pressable 
          style={[styles.resetButton, { backgroundColor: colors.glassMedium }]}
          onPress={() => {
            safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
            resetAll();
          }}
        >
          <Ionicons name="refresh-outline" size={22} color={colors.textSecondary} />
        </Pressable>
      </Animated.View>

      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Timer */}
        <PomodoroTimer size={280} />

        {/* Tips Section */}
        <Animated.View 
          style={styles.tipsSection}
          entering={FadeInUp.delay(500).springify()}
        >
          <Text style={[styles.tipsTitle, { color: colors.textSecondary }]}>
            La técnica Pomodoro
          </Text>
          
          <View style={[styles.tipCard, { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder }]}>
            <View style={[styles.tipIcon, { backgroundColor: colors.accentPurple + '20' }]}>
              <Ionicons name="time-outline" size={20} color={colors.accentPurple} />
            </View>
            <View style={styles.tipContent}>
              <Text style={[styles.tipLabel, { color: colors.textPrimary }]}>Trabaja 25 minutos</Text>
              <Text style={[styles.tipDescription, { color: colors.textTertiary }]}>
                Concentración total en una tarea
              </Text>
            </View>
          </View>

          <View style={[styles.tipCard, { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder }]}>
            <View style={[styles.tipIcon, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="cafe-outline" size={20} color={colors.success} />
            </View>
            <View style={styles.tipContent}>
              <Text style={[styles.tipLabel, { color: colors.textPrimary }]}>Descansa 5 minutos</Text>
              <Text style={[styles.tipDescription, { color: colors.textTertiary }]}>
                Estira, respira, relájate
              </Text>
            </View>
          </View>

          <View style={[styles.tipCard, { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder }]}>
            <View style={[styles.tipIcon, { backgroundColor: colors.accentCyan + '20' }]}>
              <Ionicons name="repeat-outline" size={20} color={colors.accentCyan} />
            </View>
            <View style={styles.tipContent}>
              <Text style={[styles.tipLabel, { color: colors.textPrimary }]}>Repite el ciclo</Text>
              <Text style={[styles.tipDescription, { color: colors.textTertiary }]}>
                Cada 4 pomodoros, toma un descanso largo
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Today's Stats */}
        <Animated.View 
          style={styles.statsSection}
          entering={FadeInUp.delay(600).springify()}
        >
          <View style={[styles.statsCard, { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.accentPurple }]}>
                {sessionsCompleted}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                Sesiones hoy
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.glassBorder }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {Math.round(sessionsCompleted * 25)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                Minutos enfocado
              </Text>
            </View>
          </View>
        </Animated.View>

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

  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    flex: 1,
  },

  scrollContainer: {
    paddingHorizontal: spacing.lg,
  },

  tipsSection: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },

  tipsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },

  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },

  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tipContent: {
    flex: 1,
  },

  tipLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 2,
  },

  tipDescription: {
    fontSize: typography.fontSize.sm,
  },

  statsSection: {
    marginTop: spacing.xl,
  },

  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
  },

  statLabel: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },

  statDivider: {
    width: 1,
    height: 50,
    marginHorizontal: spacing.lg,
  },
});
