/**
 * SubtaskItem - Individual Subtask Component
 * Task List App 2026
 * 
 * Features:
 * - Animated checkbox
 * - Glassmorphism design
 * - Delete button
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInRight,
  FadeOutRight,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, typography } from '../constants/theme';

export default function SubtaskItem({ subtask, onToggle, onDelete }) {
  const { colors } = useTheme();
  const checkScale = useSharedValue(subtask.completed ? 1 : 0);

  const handleToggle = () => {
    checkScale.value = withSpring(subtask.completed ? 0 : 1, { 
      damping: 12, 
      stiffness: 200 
    });
    onToggle();
  };

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  return (
    <Animated.View 
      style={[styles.container, { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder }]}
      entering={FadeInRight.springify()}
      exiting={FadeOutRight.springify()}
    >
      {/* Checkbox */}
      <TouchableOpacity 
        style={styles.checkbox} 
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <View style={[
          styles.checkboxOuter,
          { borderColor: colors.textTertiary },
          subtask.completed && { borderColor: colors.success }
        ]}>
          <Animated.View style={[styles.checkboxInner, { backgroundColor: colors.success }, checkAnimatedStyle]}>
            <Ionicons name="checkmark" size={12} color={colors.white} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Title */}
      <Pressable style={styles.titleContainer} onPress={handleToggle}>
        <Text 
          style={[
            styles.title,
            { color: colors.textPrimary },
            subtask.completed && { textDecorationLine: 'line-through', color: colors.textTertiary }
          ]}
          numberOfLines={2}
        >
          {subtask.title}
        </Text>
      </Pressable>

      {/* Delete button */}
      <TouchableOpacity 
        style={[styles.deleteButton, { backgroundColor: colors.error + '15' }]}
        onPress={onDelete}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={16} color={colors.error} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },

  checkbox: {
    marginRight: spacing.md,
  },

  checkboxOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  checkboxInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },

  titleContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },

  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
  },

  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
