/**
 * DayOfWeekPicker - Interactive day selection pills
 * Task List App 2026
 * 
 * Allows users to select specific days of the week
 * for weekly recurring tasks.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, typography } from '../constants/theme';
import { DAYS_OF_WEEK } from '../utils/recurringHelpers';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Single day pill component
 */
const DayPill = ({ day, label, selected, onPress, accentColor }) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: selected 
      ? accentColor + '20'
      : colors.glassMedium,
    borderColor: selected 
      ? accentColor 
      : colors.glassBorder,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      style={[styles.dayPill, animatedStyle]}
      onPress={() => onPress(day)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Text style={[
        styles.dayLabel,
        { color: selected ? accentColor : colors.textSecondary }
      ]}>
        {label}
      </Text>
      {selected && (
        <View style={[styles.selectedIndicator, { backgroundColor: accentColor }]} />
      )}
    </AnimatedPressable>
  );
};

/**
 * Day of Week Picker component
 * @param {Object} props
 * @param {number[]} props.selectedDays - Array of selected day numbers (1-7)
 * @param {Function} props.onDaysChange - Callback when selection changes
 * @param {string} [props.accentColor] - Optional accent color
 */
const DayOfWeekPicker = ({ selectedDays = [], onDaysChange, accentColor }) => {
  const { colors } = useTheme();
  const color = accentColor || colors.accentCyan;

  const toggleDay = (day) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day].sort((a, b) => a - b);
    onDaysChange(newDays);
  };

  return (
    <View style={styles.container}>
      {Object.entries(DAYS_OF_WEEK).map(([day, { short }]) => (
        <DayPill
          key={day}
          day={parseInt(day)}
          label={short}
          selected={selectedDays.includes(parseInt(day))}
          onPress={toggleDay}
          accentColor={color}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    position: 'relative',
  },
  dayLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default DayOfWeekPicker;
