/**
 * Kanban Column Component
 * Bitrova TaskList App - Phase 3 B2B
 * 
 * Individual column with tasks and drop zone
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import KanbanCard from './KanbanCard';
import { Ionicons } from '@expo/vector-icons';

export default function KanbanColumn({
  column,
  tasks,
  onTaskPress,
  onAddTask,
  onDragStart,
  onDrop,
  isDragTarget,
  onDragOver,
  onDragLeave,
  draggingTask,
  columnWidth,
}) {
  const { colors, isDarkMode } = useTheme();
  const { updateWorkspace } = useWorkspace();
  
  const [isEditing, setIsEditing] = useState(false);
  const [columnName, setColumnName] = useState(column.name);

  // Handle column name edit
  const handleNameSave = useCallback(async () => {
    setIsEditing(false);
    if (columnName !== column.name && column.id !== 'uncategorized') {
      // TODO: Add column update function
      // await updateColumn(column.id, { name: columnName });
    }
  }, [columnName, column]);

  // Calculate task count and WIP status
  const taskCount = tasks.length;
  const isOverWipLimit = column.wip_limit && taskCount > column.wip_limit;

  const styles = createStyles(colors, isDarkMode, column.color, isDragTarget, isOverWipLimit, columnWidth);

  return (
    <View 
      style={styles.container}
      onTouchEnd={() => {
        if (draggingTask) {
          onDrop?.(taskCount);
        }
      }}
    >
      {/* Column Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.colorDot, { backgroundColor: column.color }]} />
          
          {isEditing ? (
            <TextInput
              style={styles.nameInput}
              value={columnName}
              onChangeText={setColumnName}
              onBlur={handleNameSave}
              onSubmitEditing={handleNameSave}
              autoFocus
            />
          ) : (
            <TouchableOpacity 
              onPress={() => column.id !== 'uncategorized' && setIsEditing(true)}
            >
              <Text style={styles.columnName}>{column.name}</Text>
            </TouchableOpacity>
          )}
          
          <View style={[styles.countBadge, isOverWipLimit && styles.countBadgeWarning]}>
            <Text style={[styles.countText, isOverWipLimit && styles.countTextWarning]}>
              {taskCount}
              {column.wip_limit ? `/${column.wip_limit}` : ''}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.menuBtn}>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Tasks */}
      <ScrollView 
        style={styles.tasksContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.tasksContent}
      >
        {tasks.map((task, index) => (
          <KanbanCard
            key={task.id}
            task={task}
            onPress={() => onTaskPress?.(task)}
            onDragStart={() => onDragStart?.(task)}
            isDragging={draggingTask?.id === task.id}
          />
        ))}

        {/* Drop zone indicator */}
        {isDragTarget && draggingTask && (
          <View style={styles.dropIndicator}>
            <Text style={styles.dropIndicatorText}>Drop here</Text>
          </View>
        )}

        {/* Empty state */}
        {tasks.length === 0 && !isDragTarget && (
          <View style={styles.emptyColumn}>
            <Text style={styles.emptyText}>No tasks</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Task Button */}
      <TouchableOpacity style={styles.addTaskBtn} onPress={onAddTask}>
        <Ionicons name="add" size={18} color={colors.textSecondary} />
        <Text style={styles.addTaskText}>Add task</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors, isDarkMode, columnColor, isDragTarget, isOverWip, columnWidth) =>
  StyleSheet.create({
    container: {
      width: columnWidth,
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc',
      borderRadius: 12,
      marginRight: 12,
      borderWidth: isDragTarget ? 2 : 1,
      borderColor: isDragTarget ? colors.accentPurple : colors.border,
      borderStyle: isDragTarget ? 'dashed' : 'solid',
      maxHeight: '100%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    colorDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    columnName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    nameInput: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      padding: 0,
      minWidth: 100,
    },
    countBadge: {
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    countBadgeWarning: {
      backgroundColor: '#fef3c7',
    },
    countText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    countTextWarning: {
      color: '#d97706',
    },
    menuBtn: {
      padding: 4,
    },
    tasksContainer: {
      flex: 1,
      minHeight: 100,
      maxHeight: 400,
    },
    tasksContent: {
      padding: 8,
      gap: 8,
    },
    dropIndicator: {
      height: 60,
      backgroundColor: colors.accentPurple + '20',
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.accentPurple,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropIndicatorText: {
      fontSize: 13,
      color: colors.accentPurple,
      fontWeight: '500',
    },
    emptyColumn: {
      padding: 20,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 13,
      color: colors.textTertiary,
    },
    addTaskBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    addTaskText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });
