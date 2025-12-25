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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { TaskContext } from '../context/TaskContext';
import { colors, spacing, borderRadius, typography, categories, priorities } from '../constants/theme';
import GradientButton from '../components/GradientButton';
import DatePickerButton from '../components/DatePickerButton';

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
  const navigation = useNavigation();
  const { addTask } = useContext(TaskContext);
  
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('personal');
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [dueDate, setDueDate] = useState(null);

  const handleSubmit = () => {
    if (!title.trim()) {
      safeHaptics.notification(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    addTask({
      title: title.trim(),
      category: selectedCategory,
      priority: selectedPriority,
      dueDate: dueDate ? dueDate.toISOString() : null,
      completed: false,
      createdAt: new Date().toISOString(),
    });
    
    safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };


  // Filter out 'all' category
  const taskCategories = Object.values(categories).filter(c => c.id !== 'all');

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <Animated.View 
        style={styles.header}
        entering={FadeInUp.springify()}
      >
        <Pressable 
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Nueva Tarea</Text>
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
          <Text style={styles.label}>¿Qué necesitas hacer?</Text>
          <TextInput
            style={styles.input}
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
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.optionsGrid}>
            {taskCategories.map((category, index) => (
              <Animated.View
                key={category.id}
                entering={FadeInRight.delay(200 + index * 50).springify()}
              >
                <Pressable
                  style={[
                    styles.optionCard,
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
          <Text style={styles.label}>Fecha límite</Text>
          <DatePickerButton 
            value={dueDate}
            onChange={setDueDate}
            placeholder="Agregar fecha límite"
          />
        </Animated.View>

        {/* Priority Selection */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(350).springify()}
        >
          <Text style={styles.label}>Prioridad</Text>
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
        style={styles.footer}
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
            <Text style={styles.submitText}>Crear Tarea</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
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
    backgroundColor: colors.glassMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
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
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  input: {
    backgroundColor: colors.glassMedium,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
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
    backgroundColor: colors.glassMedium,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
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
    color: colors.textSecondary,
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
    backgroundColor: colors.glassMedium,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: spacing.sm,
  },
  
  priorityText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
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
    color: colors.white,
  },
});
