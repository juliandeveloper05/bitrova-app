/**
 * PomodoroWidget - Mini Timer Widget for Home Screen
 * Task List App 2026
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { usePomodoro, POMODORO_MODES } from '../context/PomodoroContext';
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PomodoroWidget() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    mode,
    timeRemaining,
    isRunning,
    sessionsCompleted,
    toggleTimer,
    formatTime,
    getModeLabel,
    POMODORO_MODES,
  } = usePomodoro();

  const scale = useSharedValue(1);

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

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInUp.delay(200).springify()}>
      <AnimatedPressable
        style={[
          styles.container,
          { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder },
          animatedStyle
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
          router.push('/pomodoro');
        }}
      >
        {/* Left: Tomato Icon & Mode */}
        <View style={styles.leftSection}>
          <View style={[styles.iconContainer, { backgroundColor: modeColor + '20' }]}>
            <Text style={styles.tomatoIcon}>🍅</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.modeLabel, { color: modeColor }]}>
              {getModeLabel()}
            </Text>
            <Text style={[styles.sessionLabel, { color: colors.textTertiary }]}>
              {sessionsCompleted} {sessionsCompleted === 1 ? 'sesión' : 'sesiones'}
            </Text>
          </View>
        </View>

        {/* Right: Timer & Play Button */}
        <View style={styles.rightSection}>
          <Text style={[styles.timerText, { color: colors.textPrimary }]}>
            {formatTime(timeRemaining)}
          </Text>
          
          <Pressable
            style={styles.playButton}
            onPress={(e) => {
              e.stopPropagation();
              safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
              toggleTimer();
            }}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.playButtonGradient}
            >
              <Ionicons 
                name={isRunning ? 'pause' : 'play'} 
                size={18} 
                color={colors.white}
                style={!isRunning && { marginLeft: 2 }}
              />
            </LinearGradient>
          </Pressable>
        </View>

        {/* Running Indicator */}
        {isRunning && (
          <View style={[styles.runningIndicator, { backgroundColor: modeColor }]} />
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },

  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tomatoIcon: {
    fontSize: 24,
  },

  textContainer: {
    gap: 2,
  },

  modeLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },

  sessionLabel: {
    fontSize: typography.fontSize.xs,
  },

  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  timerText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },

  playButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },

  playButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  runningIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
});
