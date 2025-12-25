/**
 * TaskCard - Modern Task Item Component
 * Task List App 2026
 * 
 * Features:
 * - Glassmorphism design
 * - Priority indicator with glow
 * - Animated checkbox
 * - Swipe to delete
 * - Category badge
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors, spacing, borderRadius, typography, shadows, priorities, categories } from '../constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function TaskCard({ task, onToggle, onDelete, onPress }) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const deleteOpacity = useSharedValue(0);
  const checkScale = useSharedValue(task.completed ? 1 : 0);
  
  // Get priority and category config
  const priority = priorities[task.priority] || priorities.medium;
  const category = categories[task.category] || categories.personal;
  
  // Format due date for display
  const formatDueDate = (dateString) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Reset time for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    const isToday = compareDate.getTime() === today.getTime();
    const isTomorrow = compareDate.getTime() === tomorrow.getTime();
    const isOverdue = compareDate < today;
    
    if (isToday) return { text: 'Hoy', isOverdue: false };
    if (isTomorrow) return { text: 'Mañana', isOverdue: false };
    if (isOverdue) return { 
      text: 'Vencido', 
      isOverdue: true 
    };
    
    return { 
      text: date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      isOverdue: false 
    };
  };
  
  const dueDateInfo = formatDueDate(task.dueDate);
  
  // Press animation
  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };
  
  // Toggle completion with animation
  const handleToggle = () => {
    checkScale.value = withSpring(task.completed ? 0 : 1, { 
      damping: 12, 
      stiffness: 200 
    });
    onToggle(task.id);
  };
  
  // Swipe gesture for delete
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, -120);
        deleteOpacity.value = interpolate(
          Math.abs(event.translationX),
          [0, 80],
          [0, 1]
        );
      }
    })
    .onEnd((event) => {
      if (event.translationX < -80) {
        translateX.value = withTiming(-400, { duration: 200 });
        runOnJS(onDelete)(task.id);
      } else {
        translateX.value = withSpring(0);
        deleteOpacity.value = withTiming(0);
      }
    });
  
  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
    ],
  }));
  
  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));
  
  const deleteButtonStyle = useAnimatedStyle(() => ({
    opacity: deleteOpacity.value,
    transform: [{ scale: interpolate(deleteOpacity.value, [0, 1], [0.8, 1]) }],
  }));

  return (
    <View style={styles.wrapper}>
      {/* Delete button behind card */}
      <Animated.View style={[styles.deleteButton, deleteButtonStyle]}>
        <Ionicons name="trash" size={24} color={colors.white} />
      </Animated.View>
      
      <GestureDetector gesture={panGesture}>
        <AnimatedPressable
          style={[styles.container, cardAnimatedStyle]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
        >
          {/* Priority indicator line */}
          <View style={[styles.priorityLine, { backgroundColor: priority.color }]} />
          
          <View style={styles.content}>
            {/* Checkbox */}
            <TouchableOpacity 
              style={styles.checkbox} 
              onPress={handleToggle}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkboxOuter,
                task.completed && { borderColor: colors.success }
              ]}>
                <Animated.View style={[styles.checkboxInner, checkAnimatedStyle]}>
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                </Animated.View>
              </View>
            </TouchableOpacity>
            
            {/* Task content */}
            <View style={styles.textContainer}>
              <Text 
                style={[
                  styles.title,
                  task.completed && styles.titleCompleted
                ]}
                numberOfLines={2}
              >
                {task.title}
              </Text>
              
              <View style={styles.metaRow}>
                {/* Category badge */}
                <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
                  <Ionicons name={category.icon} size={10} color={category.color} />
                  <Text style={[styles.categoryText, { color: category.color }]}>
                    {category.name}
                  </Text>
                </View>
                
                {/* Due date if exists */}
                {dueDateInfo && (
                  <View style={[
                    styles.dueDateContainer,
                    dueDateInfo.isOverdue && styles.dueDateOverdue
                  ]}>
                    <Ionicons 
                      name={dueDateInfo.isOverdue ? "alert-circle" : "calendar-outline"} 
                      size={12} 
                      color={dueDateInfo.isOverdue ? colors.error : colors.accentCyan} 
                    />
                    <Text style={[
                      styles.dueDate,
                      dueDateInfo.isOverdue && styles.dueDateTextOverdue
                    ]}>
                      {dueDateInfo.text}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Priority icon */}
            <View style={[styles.priorityBadge, { backgroundColor: priority.color + '20' }]}>
              <Ionicons name={priority.icon} size={16} color={priority.color} />
            </View>
          </View>
        </AnimatedPressable>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    position: 'relative',
  },
  
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  container: {
    backgroundColor: colors.glassMedium,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    ...shadows.md,
  },
  
  priorityLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingLeft: spacing.lg + 4,
  },
  
  checkbox: {
    marginRight: spacing.md,
  },
  
  checkboxOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  
  textContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textTertiary,
  },
  
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  
  categoryText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accentCyan + '15',
  },
  
  dueDateOverdue: {
    backgroundColor: colors.error + '15',
  },
  
  dueDate: {
    fontSize: typography.fontSize.xs,
    color: colors.accentCyan,
    fontWeight: typography.fontWeight.medium,
  },
  
  dueDateTextOverdue: {
    color: colors.error,
  },
  
  priorityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
