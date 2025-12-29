/**
 * PomodoroTimer - Circular Progress Timer Component
 * Task List App 2026
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInUp, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { usePomodoro, POMODORO_MODES } from '../context/PomodoroContext';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, typography, shadows } from '../constants/theme';

// Safe haptics wrapper
const safeHaptics = {
  impact: (style) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PomodoroTimer({ size = 280 }) {
  const { colors } = useTheme();
  const {
    mode,
    timeRemaining,
    isRunning,
    sessionsCompleted,
    toggleTimer,
    reset,
    skip,
    formatTime,
    getProgress,
    getModeLabel,
    POMODORO_MODES,
  } = usePomodoro();

  // Animation values
  const playScale = useSharedValue(1);
  const resetScale = useSharedValue(1);
  const skipScale = useSharedValue(1);

  // Circle calculations
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = getProgress();
  const strokeDashoffset = circumference * (1 - progress);

  // Get mode color
  const getModeColor = () => {
    switch (mode) {
      case POMODORO_MODES.WORK:
        return colors.accentPurple;
      case POMODORO_MODES.SHORT_BREAK:
        return colors.success;
      case POMODORO_MODES.LONG_BREAK:
        return colors.accentCyan;
      default:
        return colors.accentPurple;
    }
  };

  const modeColor = getModeColor();

  // Button press animations
  const createPressHandler = (scaleValue) => ({
    onPressIn: () => {
      scaleValue.value = withSpring(0.9, { damping: 15, stiffness: 400 });
    },
    onPressOut: () => {
      scaleValue.value = withSpring(1, { damping: 15, stiffness: 400 });
    },
  });

  const playAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playScale.value }],
  }));

  const resetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resetScale.value }],
  }));

  const skipAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: skipScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Mode Label */}
      <Animated.View 
        style={styles.modeContainer}
        entering={FadeInUp.delay(100).springify()}
      >
        <View style={[styles.modeBadge, { backgroundColor: modeColor + '20' }]}>
          <View style={[styles.modeDot, { backgroundColor: modeColor }]} />
          <Text style={[styles.modeText, { color: modeColor }]}>
            {getModeLabel()}
          </Text>
        </View>
      </Animated.View>

      {/* Circular Timer */}
      <Animated.View 
        style={styles.timerContainer}
        entering={FadeInUp.delay(200).springify()}
      >
        {/* Background Circle */}
        <Svg width={size} height={size} style={styles.svg}>
          <Defs>
            <SvgGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colors.gradientStart} />
              <Stop offset="100%" stopColor={colors.gradientEnd} />
            </SvgGradient>
          </Defs>
          
          {/* Background track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.glassMedium}
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>

        {/* Time Display */}
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: colors.textPrimary }]}>
            {formatTime(timeRemaining)}
          </Text>
          
          {/* Session Counter */}
          <View style={styles.sessionsContainer}>
            {[...Array(4)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.sessionDot,
                  { 
                    backgroundColor: index < (sessionsCompleted % 4) 
                      ? colors.accentPurple 
                      : colors.glassMedium 
                  }
                ]}
              />
            ))}
          </View>
          <Text style={[styles.sessionText, { color: colors.textTertiary }]}>
            {sessionsCompleted} {sessionsCompleted === 1 ? 'sesión' : 'sesiones'} hoy
          </Text>
        </View>
      </Animated.View>

      {/* Control Buttons */}
      <Animated.View 
        style={styles.controlsContainer}
        entering={FadeInUp.delay(300).springify()}
      >
        {/* Reset Button */}
        <AnimatedPressable
          style={[
            styles.secondaryButton, 
            { backgroundColor: colors.glassMedium },
            resetAnimatedStyle
          ]}
          {...createPressHandler(resetScale)}
          onPress={() => {
            safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
            reset();
          }}
        >
          <Ionicons name="refresh" size={24} color={colors.textSecondary} />
        </AnimatedPressable>

        {/* Play/Pause Button */}
        <AnimatedPressable
          style={[styles.primaryButton, playAnimatedStyle]}
          {...createPressHandler(playScale)}
          onPress={() => {
            safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
            toggleTimer();
          }}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryButtonGradient}
          >
            <Ionicons 
              name={isRunning ? 'pause' : 'play'} 
              size={36} 
              color={colors.white}
              style={!isRunning && { marginLeft: 4 }}
            />
          </LinearGradient>
        </AnimatedPressable>

        {/* Skip Button */}
        <AnimatedPressable
          style={[
            styles.secondaryButton, 
            { backgroundColor: colors.glassMedium },
            skipAnimatedStyle
          ]}
          {...createPressHandler(skipScale)}
          onPress={() => {
            safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
            skip();
          }}
        >
          <Ionicons name="play-skip-forward" size={24} color={colors.textSecondary} />
        </AnimatedPressable>
      </Animated.View>

      {/* Mode Selector */}
      <Animated.View 
        style={styles.modeSelectorContainer}
        entering={FadeInUp.delay(400).springify()}
      >
        <ModeButton 
          label="Trabajo" 
          mode={POMODORO_MODES.WORK} 
          currentMode={mode}
          color={colors.accentPurple}
        />
        <ModeButton 
          label="Corto" 
          mode={POMODORO_MODES.SHORT_BREAK} 
          currentMode={mode}
          color={colors.success}
        />
        <ModeButton 
          label="Largo" 
          mode={POMODORO_MODES.LONG_BREAK} 
          currentMode={mode}
          color={colors.accentCyan}
        />
      </Animated.View>
    </View>
  );
}

// Mode selector button
function ModeButton({ label, mode, currentMode, color }) {
  const { colors } = useTheme();
  const { setTimerMode } = usePomodoro();
  const isActive = mode === currentMode;

  return (
    <Pressable
      style={[
        styles.modeButton,
        { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder },
        isActive && { backgroundColor: color + '20', borderColor: color }
      ]}
      onPress={() => {
        safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
        setTimerMode(mode);
      }}
    >
      <Text style={[
        styles.modeButtonText,
        { color: colors.textSecondary },
        isActive && { color: color }
      ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  modeContainer: {
    marginBottom: spacing.xl,
  },

  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },

  modeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  modeText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },

  timerContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  svg: {
    transform: [{ rotate: '0deg' }],
  },

  timeContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  timeText: {
    fontSize: 56,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -2,
  },

  sessionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },

  sessionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  sessionText: {
    fontSize: typography.fontSize.sm,
  },

  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginTop: spacing.xxl,
  },

  secondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButton: {
    ...shadows.lg,
  },

  primaryButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modeSelectorContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xxl,
  },

  modeButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },

  modeButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
