/**
 * Add Task Screen - Task List App 2026
 * Modern Bottom Sheet Style Form
 */

import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { TaskContext } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, typography, categories, priorities } from '../constants/theme';
import GradientButton from '../components/GradientButton';
import DatePickerButton from '../components/DatePickerButton';
import ReminderToggle from '../components/ReminderToggle';
import RecurrenceSelector from '../components/RecurrenceSelector';
import { DEFAULT_RECURRING_CONFIG } from '../utils/recurringHelpers';

// Safe haptics wrapper for web compatibility
const safeHaptics = {
  impact: (style) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  },
  notification: (type) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(type);
    }
  }
};

export default function AddTask() {
  const router = useRouter();
  const { addTask, createRecurringTask } = useContext(TaskContext);
  const { colors } = useTheme();
  
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('personal');
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [dueDate, setDueDate] = useState(null);
  const [enableReminder, setEnableReminder] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringConfig, setRecurringConfig] = useState({
    ...DEFAULT_RECURRING_CONFIG,
    startDate: new Date().toISOString(),
  });

  const handleSubmit = async () => {
    if (!title.trim()) {
      safeHaptics.notification(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const taskData = {
      title: title.trim(),
      category: selectedCategory,
      priority: selectedPriority,
      enableReminder: enableReminder,
    };

    if (isRecurring) {
      // Validate recurring config has start date
      if (!recurringConfig.startDate) {
        safeHaptics.notification(Haptics.NotificationFeedbackType.Error);
        return;
      }
      // Create recurring task series
      await createRecurringTask(taskData, recurringConfig);
    } else {
      // Create regular task
      await addTask({
        ...taskData,
        dueDate: dueDate ? dueDate.toISOString() : null,
        completed: false,
        createdAt: new Date().toISOString(),
      });
    }
    
    safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  // Filter out 'all' category
  const taskCategories = Object.values(categories).filter(c => c.id !== 'all');

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <Animated.View 
        style={styles.header}
        entering={FadeInUp.springify()}
      >
        <Pressable 
          style={[styles.closeButton, { backgroundColor: colors.glassMedium }]}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Nueva Tarea</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Task Title Input */}
        <Animated.View 
          style={styles.inputSection}
          entering={FadeInUp.delay(100).springify()}
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>¿Qué necesitas hacer?</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder, color: colors.textPrimary }]}
            placeholder="Escribe tu tarea..."
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            autoFocus
            multiline
            maxLength={200}
          />
        </Animated.View>

        {/* Category Selection */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(200).springify()}
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>Categoría</Text>
          <View style={styles.optionsGrid}>
            {taskCategories.map((category, index) => (
              <Animated.View
                key={category.id}
                entering={FadeInRight.delay(200 + index * 50).springify()}
              >
                <Pressable
                  style={[
                    styles.optionCard,
                    { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder },
                    selectedCategory === category.id && {
                      backgroundColor: category.color + '20',
                      borderColor: category.color,
                    }
                  ]}
                  onPress={() => {
                    setSelectedCategory(category.id);
                    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <View style={[
                    styles.optionIcon,
                    { backgroundColor: category.color + '30' }
                  ]}>
                    <Ionicons 
                      name={category.icon} 
                      size={20} 
                      color={category.color} 
                    />
                  </View>
                  <Text style={[
                    styles.optionText,
                    { color: colors.textSecondary },
                    selectedCategory === category.id && { color: category.color }
                  ]}>
                    {category.name}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Due Date Selection */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(300).springify()}
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>Fecha límite</Text>
          <DatePickerButton 
            value={dueDate}
            onChange={(date) => {
              setDueDate(date);
              // Auto-enable reminder when date is set
              if (date && !enableReminder) {
                setEnableReminder(true);
              }
            }}
            placeholder="Agregar fecha límite"
          />
          
          {/* Reminder Toggle - only show when date is set */}
          {dueDate && (
            <Animated.View
              style={{ marginTop: spacing.md }}
              entering={FadeInUp.springify()}
            >
              <ReminderToggle 
                enabled={enableReminder}
                onToggle={setEnableReminder}
                label="Recordarme a las 9:00 AM"
              />
            </Animated.View>
          )}
        </Animated.View>

        {/* Recurrence Section */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(325).springify()}
        >
          <Pressable
            style={styles.recurrenceToggle}
            onPress={() => {
              setIsRecurring(!isRecurring);
              safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={[
              styles.toggleCircle,
              { 
                backgroundColor: isRecurring ? colors.accentCyan : 'transparent',
                borderColor: isRecurring ? colors.accentCyan : colors.glassBorder,
              }
            ]}>
              {isRecurring && (
                <Ionicons name="checkmark" size={14} color={colors.bgPrimary} />
              )}
            </View>
            <View style={styles.toggleContent}>
              <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
                Hacer esta tarea recurrente
              </Text>
              <Text style={[styles.toggleDescription, { color: colors.textTertiary }]}>
                Se repetirá automáticamente según el patrón
              </Text>
            </View>
            <Ionicons 
              name="repeat" 
              size={20} 
              color={isRecurring ? colors.accentCyan : colors.textTertiary} 
            />
          </Pressable>

          {isRecurring && (
            <Animated.View
              style={[styles.recurrenceContainer, { backgroundColor: colors.glassLight }]}
              entering={FadeInUp.duration(200)}
            >
              <RecurrenceSelector
                config={recurringConfig}
                onChange={setRecurringConfig}
              />
            </Animated.View>
          )}
        </Animated.View>

        {/* Priority Selection */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(350).springify()}
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>Prioridad</Text>
          <View style={styles.priorityRow}>
            {Object.values(priorities).map((priority, index) => (
              <Animated.View
                key={priority.id}
                style={styles.priorityItem}
                entering={FadeInRight.delay(300 + index * 50).springify()}
              >
                <Pressable
                  style={[
                    styles.priorityCard,
                    { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder },
                    selectedPriority === priority.id && {
                      backgroundColor: priority.color + '20',
                      borderColor: priority.color,
                    }
                  ]}
                  onPress={() => {
                    setSelectedPriority(priority.id);
                    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Ionicons 
                    name={priority.icon} 
                    size={24} 
                    color={selectedPriority === priority.id ? priority.color : colors.textTertiary} 
                  />
                  <Text style={[
                    styles.priorityText,
                    { color: colors.textSecondary },
                    selectedPriority === priority.id && { color: priority.color }
                  ]}>
                    {priority.name}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Submit Button */}
      <Animated.View 
        style={[styles.footer, { backgroundColor: colors.bgPrimary }]}
        entering={FadeInUp.delay(400).springify()}
      >
        <Pressable style={styles.submitButton} onPress={handleSubmit}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitGradient}
          >
            <Ionicons name="add" size={24} color={colors.white} />
            <Text style={[styles.submitText, { color: colors.white }]}>Crear Tarea</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </KeyboardAvoidingView>
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
  
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  
  placeholder: {
    width: 40,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  
  inputSection: {
    marginBottom: spacing.xl,
  },
  
  section: {
    marginBottom: spacing.xl,
  },
  
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  input: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    fontSize: typography.fontSize.lg,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  optionText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  
  priorityRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  
  priorityItem: {
    flex: 1,
  },
  
  priorityCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  
  priorityText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  
  submitButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  
  submitText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  
  recurrenceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  toggleContent: {
    flex: 1,
  },
  
  toggleLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  
  toggleDescription: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  
  recurrenceContainer: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
});