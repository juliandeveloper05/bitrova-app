/**
 * RecurrenceSelector - Recurrence configuration component
 * Task List App 2026
 * 
 * Allows users to configure recurring task patterns:
 * - Daily, Weekly, Monthly, or Custom
 * - Frequency selection
 * - Day of week selection (for weekly)
 * - Start/end date configuration
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, { 
  FadeInDown, 
  FadeOutUp, 
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, typography } from '../constants/theme';
import DayOfWeekPicker from './DayOfWeekPicker';
import DatePickerButton from './DatePickerButton';
import { 
  RECURRENCE_PATTERNS, 
  DEFAULT_RECURRING_CONFIG,
  formatRecurrencePreview,
} from '../utils/recurringHelpers';

// Safe haptics wrapper
const safeHaptics = {
  impact: (style) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  },
};

/**
 * Pattern tab button component
 */
const PatternTab = ({ id, label, icon, selected, onPress, colors }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <Animated.View style={[styles.tabWrapper, animatedStyle]}>
      <Pressable
        style={[
          styles.patternTab,
          { 
            backgroundColor: selected ? colors.accentCyan + '20' : colors.glassMedium,
            borderColor: selected ? colors.accentCyan : colors.glassBorder,
          }
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Ionicons 
          name={icon} 
          size={18} 
          color={selected ? colors.accentCyan : colors.textSecondary} 
        />
        <Text style={[
          styles.tabLabel,
          { color: selected ? colors.accentCyan : colors.textSecondary }
        ]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

/**
 * Frequency input component
 */
const FrequencyInput = ({ value, onChange, unit, colors }) => {
  return (
    <View style={styles.frequencyContainer}>
      <Text style={[styles.frequencyLabel, { color: colors.textSecondary }]}>
        Repetir cada
      </Text>
      <TextInput
        style={[
          styles.frequencyInput,
          { 
            backgroundColor: colors.glassMedium, 
            borderColor: colors.glassBorder,
            color: colors.textPrimary,
          }
        ]}
        value={value.toString()}
        onChangeText={(text) => {
          const num = parseInt(text) || 1;
          onChange(Math.max(1, Math.min(99, num)));
        }}
        keyboardType="number-pad"
        maxLength={2}
      />
      <Text style={[styles.frequencyUnit, { color: colors.textSecondary }]}>
        {unit}
      </Text>
    </View>
  );
};

/**
 * Day of month selector
 */
const DayOfMonthSelector = ({ value, onChange, colors }) => {
  return (
    <View style={styles.dayOfMonthContainer}>
      <Text style={[styles.frequencyLabel, { color: colors.textSecondary }]}>
        El día
      </Text>
      <TextInput
        style={[
          styles.frequencyInput,
          { 
            backgroundColor: colors.glassMedium, 
            borderColor: colors.glassBorder,
            color: colors.textPrimary,
          }
        ]}
        value={value?.toString() || '1'}
        onChangeText={(text) => {
          const num = parseInt(text) || 1;
          onChange(Math.max(1, Math.min(31, num)));
        }}
        keyboardType="number-pad"
        maxLength={2}
      />
      <Text style={[styles.frequencyUnit, { color: colors.textSecondary }]}>
        del mes
      </Text>
    </View>
  );
};

/**
 * Main RecurrenceSelector component
 */
const RecurrenceSelector = ({ 
  config = DEFAULT_RECURRING_CONFIG, 
  onChange,
  startDateRequired = true,
}) => {
  const { colors } = useTheme();
  const [pattern, setPattern] = useState(config.pattern || RECURRENCE_PATTERNS.WEEKLY);
  const [frequency, setFrequency] = useState(config.frequency || 1);
  const [daysOfWeek, setDaysOfWeek] = useState(config.daysOfWeek || []);
  const [dayOfMonth, setDayOfMonth] = useState(config.dayOfMonth || 1);
  const [startDate, setStartDate] = useState(config.startDate ? new Date(config.startDate) : new Date());
  const [endDate, setEndDate] = useState(config.endDate ? new Date(config.endDate) : null);
  const [hasEndDate, setHasEndDate] = useState(!!config.endDate);

  // Pattern tab configuration
  const patterns = [
    { id: RECURRENCE_PATTERNS.DAILY, label: 'Diario', icon: 'today-outline' },
    { id: RECURRENCE_PATTERNS.WEEKLY, label: 'Semanal', icon: 'calendar-outline' },
    { id: RECURRENCE_PATTERNS.MONTHLY, label: 'Mensual', icon: 'calendar-number-outline' },
    { id: RECURRENCE_PATTERNS.CUSTOM, label: 'Custom', icon: 'options-outline' },
  ];

  // Get unit label based on pattern
  const getUnitLabel = () => {
    switch (pattern) {
      case RECURRENCE_PATTERNS.DAILY:
      case RECURRENCE_PATTERNS.CUSTOM:
        return frequency === 1 ? 'día' : 'días';
      case RECURRENCE_PATTERNS.WEEKLY:
        return frequency === 1 ? 'semana' : 'semanas';
      case RECURRENCE_PATTERNS.MONTHLY:
        return frequency === 1 ? 'mes' : 'meses';
      default:
        return 'días';
    }
  };

  // Build and emit config on changes
  useEffect(() => {
    const newConfig = {
      pattern,
      frequency,
      daysOfWeek: pattern === RECURRENCE_PATTERNS.WEEKLY ? daysOfWeek : [],
      dayOfMonth: pattern === RECURRENCE_PATTERNS.MONTHLY ? dayOfMonth : null,
      startDate: startDate?.toISOString() || null,
      endDate: hasEndDate && endDate ? endDate.toISOString() : null,
      endAfterOccurrences: null,
    };
    onChange?.(newConfig);
  }, [pattern, frequency, daysOfWeek, dayOfMonth, startDate, endDate, hasEndDate]);

  // Get preview text
  const previewConfig = {
    pattern,
    frequency,
    daysOfWeek,
    dayOfMonth,
  };
  const previewText = formatRecurrencePreview(previewConfig);

  const handlePatternChange = (newPattern) => {
    setPattern(newPattern);
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    
    // Set default days for weekly pattern
    if (newPattern === RECURRENCE_PATTERNS.WEEKLY && daysOfWeek.length === 0) {
      const today = new Date().getDay();
      setDaysOfWeek([today === 0 ? 7 : today]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Pattern Tabs */}
      <View style={styles.patternTabs}>
        {patterns.map((p) => (
          <PatternTab
            key={p.id}
            id={p.id}
            label={p.label}
            icon={p.icon}
            selected={pattern === p.id}
            onPress={() => handlePatternChange(p.id)}
            colors={colors}
          />
        ))}
      </View>

      {/* Frequency Input */}
      <Animated.View 
        style={styles.section}
        entering={FadeInDown.duration(200)}
        layout={Layout.springify()}
      >
        <FrequencyInput
          value={frequency}
          onChange={setFrequency}
          unit={getUnitLabel()}
          colors={colors}
        />
      </Animated.View>

      {/* Day of Week Picker (for weekly pattern) */}
      {pattern === RECURRENCE_PATTERNS.WEEKLY && (
        <Animated.View 
          style={styles.section}
          entering={FadeInDown.duration(200)}
          exiting={FadeOutUp.duration(150)}
          layout={Layout.springify()}
        >
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Días de la semana
          </Text>
          <DayOfWeekPicker
            selectedDays={daysOfWeek}
            onDaysChange={setDaysOfWeek}
            accentColor={colors.accentCyan}
          />
        </Animated.View>
      )}

      {/* Day of Month Selector (for monthly pattern) */}
      {pattern === RECURRENCE_PATTERNS.MONTHLY && (
        <Animated.View 
          style={styles.section}
          entering={FadeInDown.duration(200)}
          exiting={FadeOutUp.duration(150)}
          layout={Layout.springify()}
        >
          <DayOfMonthSelector
            value={dayOfMonth}
            onChange={setDayOfMonth}
            colors={colors}
          />
        </Animated.View>
      )}

      {/* Start Date */}
      <Animated.View 
        style={styles.section}
        layout={Layout.springify()}
      >
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Fecha de inicio
        </Text>
        <DatePickerButton
          value={startDate}
          onChange={setStartDate}
          placeholder="Seleccionar fecha de inicio"
        />
      </Animated.View>

      {/* End Date Toggle */}
      <Animated.View 
        style={styles.section}
        layout={Layout.springify()}
      >
        <Pressable
          style={styles.endDateToggle}
          onPress={() => {
            setHasEndDate(!hasEndDate);
            safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <View style={[
            styles.toggleCircle,
            { 
              backgroundColor: hasEndDate ? colors.accentCyan : 'transparent',
              borderColor: hasEndDate ? colors.accentCyan : colors.glassBorder,
            }
          ]}>
            {hasEndDate && (
              <Ionicons name="checkmark" size={12} color={colors.bgPrimary} />
            )}
          </View>
          <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>
            Establecer fecha de fin
          </Text>
        </Pressable>

        {hasEndDate && (
          <Animated.View 
            style={{ marginTop: spacing.md }}
            entering={FadeInDown.duration(200)}
            exiting={FadeOutUp.duration(150)}
          >
            <DatePickerButton
              value={endDate}
              onChange={setEndDate}
              placeholder="Seleccionar fecha de fin"
              minimumDate={startDate}
            />
          </Animated.View>
        )}
      </Animated.View>

      {/* Preview */}
      <Animated.View 
        style={[styles.previewContainer, { backgroundColor: colors.glassLight }]}
        layout={Layout.springify()}
      >
        <Ionicons name="repeat" size={16} color={colors.accentCyan} />
        <Text style={[styles.previewText, { color: colors.textSecondary }]}>
          {previewText}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  patternTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tabWrapper: {
    flex: 1,
  },
  patternTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: 4,
  },
  tabLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  frequencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  frequencyLabel: {
    fontSize: typography.fontSize.md,
  },
  frequencyInput: {
    width: 60,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  frequencyUnit: {
    fontSize: typography.fontSize.md,
  },
  dayOfMonthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  endDateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: {
    fontSize: typography.fontSize.md,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  previewText: {
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
});

export default RecurrenceSelector;
