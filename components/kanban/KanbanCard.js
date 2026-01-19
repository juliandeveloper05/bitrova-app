/**
 * Kanban Card Component
 * Bitrova TaskList App - Phase 3 B2B
 * 
 * Individual task card for Kanban board
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

// Priority colors
const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

// Priority icons
const PRIORITY_ICONS = {
  high: 'arrow-up',
  medium: 'remove',
  low: 'arrow-down',
};

export default function KanbanCard({ task, onPress, onDragStart, isDragging }) {
  const { colors, isDarkMode } = useTheme();
  
  const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.low;
  const priorityIcon = PRIORITY_ICONS[task.priority] || PRIORITY_ICONS.low;
  
  // Format due date
  const formatDueDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
  const dueText = formatDueDate(task.dueDate);

  const styles = createStyles(colors, isDarkMode, isDragging, priorityColor);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onDragStart}
      activeOpacity={0.7}
      delayLongPress={150}
    >
      {/* Priority Indicator */}
      <View style={styles.priorityBar} />

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>

        {/* Description snippet */}
        {task.description && (
          <Text style={styles.description} numberOfLines={1}>
            {task.description}
          </Text>
        )}

        {/* Metadata Row */}
        <View style={styles.metaRow}>
          {/* Priority */}
          <View style={[styles.metaItem, { backgroundColor: priorityColor + '20' }]}>
            <Ionicons name={priorityIcon} size={12} color={priorityColor} />
          </View>

          {/* Due Date */}
          {dueText && (
            <View style={[styles.metaItem, isOverdue && styles.overdueBadge]}>
              <Ionicons 
                name="calendar-outline" 
                size={12} 
                color={isOverdue ? '#ef4444' : colors.textSecondary} 
              />
              <Text style={[styles.metaText, isOverdue && styles.overdueText]}>
                {dueText}
              </Text>
            </View>
          )}

          {/* Category */}
          {task.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{task.category}</Text>
            </View>
          )}

          {/* Attachments indicator */}
          {task.attachments?.length > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="attach" size={12} color={colors.textSecondary} />
              <Text style={styles.metaText}>{task.attachments.length}</Text>
            </View>
          )}

          {/* Comments indicator */}
          {task.commentCount > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="chatbubble-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.metaText}>{task.commentCount}</Text>
            </View>
          )}
        </View>

        {/* Assigned Users */}
        {task.assigned_to?.length > 0 && (
          <View style={styles.assigneesRow}>
            {task.assigned_to.slice(0, 3).map((userId, index) => (
              <View 
                key={userId} 
                style={[styles.avatar, { marginLeft: index > 0 ? -8 : 0 }]}
              >
                <Text style={styles.avatarText}>
                  {/* Would show initials from user data */}
                  {index + 1}
                </Text>
              </View>
            ))}
            {task.assigned_to.length > 3 && (
              <View style={[styles.avatar, styles.avatarMore]}>
                <Text style={styles.avatarMoreText}>+{task.assigned_to.length - 3}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Completed overlay */}
      {task.completed && (
        <View style={styles.completedOverlay}>
          <Ionicons name="checkmark-circle" size={24} color={colors.accentGreen} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors, isDarkMode, isDragging, priorityColor) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDarkMode ? colors.bgSecondary : '#fff',
      borderRadius: 10,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDragging ? colors.accentPurple : colors.border,
      opacity: isDragging ? 0.5 : 1,
      transform: isDragging ? [{ scale: 1.02 }] : [],
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    priorityBar: {
      height: 3,
      backgroundColor: priorityColor,
    },
    content: {
      padding: 12,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 4,
      lineHeight: 20,
    },
    description: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 4,
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    },
    metaText: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    overdueBadge: {
      backgroundColor: '#fef2f2',
    },
    overdueText: {
      color: '#ef4444',
    },
    categoryBadge: {
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 4,
      backgroundColor: colors.accentPurple + '20',
    },
    categoryText: {
      fontSize: 11,
      color: colors.accentPurple,
      fontWeight: '500',
    },
    assigneesRow: {
      flexDirection: 'row',
      marginTop: 10,
    },
    avatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.accentBlue,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDarkMode ? colors.bgSecondary : '#fff',
    },
    avatarText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#fff',
    },
    avatarMore: {
      backgroundColor: colors.textTertiary,
      marginLeft: -8,
    },
    avatarMoreText: {
      fontSize: 9,
      fontWeight: '600',
      color: '#fff',
    },
    completedOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
