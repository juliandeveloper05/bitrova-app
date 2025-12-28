/**
 * Task Details Screen - Task List App 2026
 * View and Edit Task Details with Modern Glassmorphism
 */

import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { TaskContext } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, typography, categories, priorities } from '../constants/theme';
import DatePickerButton from '../components/DatePickerButton';
import ReminderToggle from '../components/ReminderToggle';
import SubtaskItem from '../components/SubtaskItem';

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

export default function TaskDetails() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams();
  const { tasks, updateTask, deleteTask, toggleCompleted, addSubtask, toggleSubtask, deleteSubtask } = useContext(TaskContext);
  const { colors } = useTheme();
  
  // Find the task
  const task = tasks.find(t => t.id === taskId);
  
  // Local state for editing
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('personal');
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [dueDate, setDueDate] = useState(null);
  const [enableReminder, setEnableReminder] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  
  // Initialize state when task loads
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setSelectedCategory(task.category || 'personal');
      setSelectedPriority(task.priority || 'medium');
      setDueDate(task.dueDate ? new Date(task.dueDate) : null);
      setEnableReminder(task.enableReminder || false);
    }
  }, [task]);
  
  // Track changes
  useEffect(() => {
    if (task) {
      const changed = 
        title !== task.title ||
        selectedCategory !== task.category ||
        selectedPriority !== task.priority ||
        (dueDate?.toISOString() || null) !== task.dueDate ||
        enableReminder !== task.enableReminder;
      setHasChanges(changed);
    }
  }, [title, selectedCategory, selectedPriority, dueDate, enableReminder, task]);
  
  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgPrimary }, styles.centered]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Tarea no encontrada</Text>
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={[styles.backLinkText, { color: colors.accentPurple }]}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const handleSave = () => {
    if (!title.trim()) {
      safeHaptics.notification(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    updateTask(taskId, {
      title: title.trim(),
      category: selectedCategory,
      priority: selectedPriority,
      dueDate: dueDate ? dueDate.toISOString() : null,
      enableReminder: enableReminder && dueDate !== null,
    });
    
    safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleDelete = () => {
    const performDelete = () => {
      deleteTask(taskId);
      safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
      router.back();
    };

    if (Platform.OS === 'web') {
      if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Eliminar Tarea',
        '¿Estás seguro de que quieres eliminar esta tarea?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  const handleToggleComplete = () => {
    toggleCompleted(taskId);
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  // Format creation date
  const formatDate = (dateString) => {
    if (!dateString) return 'Desconocida';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter out 'all' category
  const taskCategories = Object.values(categories).filter(c => c.id !== 'all');
  const priority = priorities[task.priority] || priorities.medium;

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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Detalles</Text>
        <Pressable 
          style={[styles.deleteButton, { backgroundColor: colors.error + '15' }]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={22} color={colors.error} />
        </Pressable>
      </Animated.View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Completion Status */}
        <Animated.View
          entering={FadeInUp.delay(50).springify()}
        >
          <Pressable 
            style={[
              styles.statusCard,
              { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder },
              task.completed && { backgroundColor: colors.success + '10', borderColor: colors.success + '30' }
            ]}
            onPress={handleToggleComplete}
          >
            <View style={[
              styles.checkCircle,
              { borderColor: colors.textTertiary },
              task.completed && { backgroundColor: colors.success, borderColor: colors.success }
            ]}>
              {task.completed && (
                <Ionicons name="checkmark" size={20} color={colors.white} />
              )}
            </View>
            <Text style={[
              styles.statusText,
              { color: colors.textPrimary },
              task.completed && { color: colors.success }
            ]}>
              {task.completed ? 'Completada' : 'Pendiente'}
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: task.completed ? colors.success + '20' : priority.color + '20' }
            ]}>
              <Ionicons 
                name={task.completed ? 'checkmark-circle' : priority.icon} 
                size={16} 
                color={task.completed ? colors.success : priority.color} 
              />
            </View>
          </Pressable>
        </Animated.View>

        {/* Task Title Input */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(100).springify()}
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>Título</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder, color: colors.textPrimary }]}
            placeholder="Nombre de la tarea"
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            multiline
            maxLength={200}
          />
        </Animated.View>

        {/* Creation Date Info */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(150).springify()}
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>Creada</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder }]}>
            <Ionicons name="time-outline" size={18} color={colors.textTertiary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{formatDate(task.createdAt)}</Text>
          </View>
        </Animated.View>

        {/* Subtasks Section */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(175).springify()}
        >
          <View style={styles.subtasksHeader}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Subtareas</Text>
            {task.subtasks && task.subtasks.length > 0 && (
              <View style={[styles.subtasksProgress, { backgroundColor: colors.accentPurple + '20' }]}>
                <Text style={[styles.subtasksProgressText, { color: colors.accentPurple }]}>
                  {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                </Text>
              </View>
            )}
          </View>
          
          {/* Progress bar */}
          {task.subtasks && task.subtasks.length > 0 && (
            <View style={[styles.progressBarContainer, { backgroundColor: colors.glassMedium }]}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    backgroundColor: colors.accentPurple,
                    width: `${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%`
                  }
                ]} 
              />
            </View>
          )}
          
          {/* Add subtask input */}
          <View style={[styles.addSubtaskContainer, { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder }]}>
            <TextInput
              style={[styles.addSubtaskInput, { color: colors.textPrimary }]}
              placeholder="Agregar subtarea..."
              placeholderTextColor={colors.textTertiary}
              value={newSubtaskText}
              onChangeText={setNewSubtaskText}
              onSubmitEditing={() => {
                if (newSubtaskText.trim()) {
                  addSubtask(taskId, newSubtaskText);
                  setNewSubtaskText('');
                  safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              returnKeyType="done"
            />
            <Pressable 
              style={[styles.addSubtaskButton, { backgroundColor: colors.accentPurple }]}
              onPress={() => {
                if (newSubtaskText.trim()) {
                  addSubtask(taskId, newSubtaskText);
                  setNewSubtaskText('');
                  safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
            >
              <Ionicons name="add" size={20} color={colors.white} />
            </Pressable>
          </View>
          
          {/* Subtasks list */}
          <View style={styles.subtasksList}>
            {(task.subtasks || []).map((subtask) => (
              <SubtaskItem
                key={subtask.id}
                subtask={subtask}
                onToggle={() => {
                  toggleSubtask(taskId, subtask.id);
                  safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
                }}
                onDelete={() => {
                  deleteSubtask(taskId, subtask.id);
                  safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
                }}
              />
            ))}
          </View>
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
          entering={FadeInUp.delay(250).springify()}
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>Fecha límite</Text>
          <DatePickerButton 
            value={dueDate}
            onChange={(date) => {
              setDueDate(date);
              if (date && !enableReminder) {
                setEnableReminder(true);
              }
            }}
            placeholder="Agregar fecha límite"
          />
          
          {/* Reminder Toggle */}
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

        {/* Priority Selection */}
        <Animated.View 
          style={styles.section}
          entering={FadeInUp.delay(300).springify()}
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
        
        {/* Spacer for button */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Save Button - only show if changes */}
      {hasChanges && (
        <Animated.View 
          style={[styles.footer, { backgroundColor: colors.bgPrimary }]}
          entering={FadeInUp.springify()}
        >
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveGradient}
            >
              <Ionicons name="checkmark" size={24} color={colors.white} />
              <Text style={[styles.saveText, { color: colors.white }]}>Guardar Cambios</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  errorText: {
    fontSize: typography.fontSize.lg,
    marginBottom: spacing.lg,
  },
  
  backLink: {
    padding: spacing.md,
  },
  
  backLinkText: {
    fontSize: typography.fontSize.md,
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
  
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
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
  
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  statusText: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
  },
  
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  input: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    fontSize: typography.fontSize.lg,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  
  infoText: {
    fontSize: typography.fontSize.md,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  
  saveButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  
  saveText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  
  // Subtasks styles
  subtasksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  
  subtasksProgress: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  
  subtasksProgressText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  addSubtaskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  
  addSubtaskInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  
  addSubtaskButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  subtasksList: {
    gap: spacing.sm,
  },
});