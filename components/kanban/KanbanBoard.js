/**
 * Kanban Board Component
 * Bitrova TaskList App - Phase 3 B2B
 * 
 * Main board component with columns and drag-drop
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTasks } from '../../context/TaskContext';
import KanbanColumn from './KanbanColumn';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = Math.min(300, SCREEN_WIDTH * 0.85);

export default function KanbanBoard({ onTaskPress, onAddTask }) {
  const { colors, isDarkMode } = useTheme();
  const { kanbanColumns, currentWorkspace, createKanbanColumn, loading } = useWorkspace();
  const { tasks, updateTask } = useTasks();
  
  const [draggingTask, setDraggingTask] = useState(null);
  const [dropTargetColumn, setDropTargetColumn] = useState(null);

  // Group tasks by column
  const tasksByColumn = useMemo(() => {
    const grouped = {};
    
    // Initialize all columns
    kanbanColumns.forEach(col => {
      grouped[col.id] = [];
    });
    
    // Add "No Column" for tasks without a column
    grouped['uncategorized'] = [];
    
    // Sort tasks into columns
    tasks.forEach(task => {
      if (task.kanban_column_id && grouped[task.kanban_column_id]) {
        grouped[task.kanban_column_id].push(task);
      } else {
        grouped['uncategorized'].push(task);
      }
    });
    
    // Sort by position within each column
    Object.keys(grouped).forEach(colId => {
      grouped[colId].sort((a, b) => (a.kanban_position || 0) - (b.kanban_position || 0));
    });
    
    return grouped;
  }, [tasks, kanbanColumns]);

  // Handle task drag start
  const handleDragStart = useCallback((task) => {
    setDraggingTask(task);
  }, []);

  // Handle task drop
  const handleDrop = useCallback(async (columnId, position) => {
    if (!draggingTask) return;

    try {
      // Update task with new column and position
      await updateTask(draggingTask.id, {
        kanban_column_id: columnId === 'uncategorized' ? null : columnId,
        kanban_position: position,
      });
    } catch (error) {
      console.error('Error moving task:', error);
    } finally {
      setDraggingTask(null);
      setDropTargetColumn(null);
    }
  }, [draggingTask, updateTask]);

  // Handle drag end (cancelled)
  const handleDragEnd = useCallback(() => {
    setDraggingTask(null);
    setDropTargetColumn(null);
  }, []);

  // Add new column
  const handleAddColumn = useCallback(async () => {
    try {
      await createKanbanColumn({
        name: 'New Column',
        color: '#94a3b8',
      });
    } catch (error) {
      console.error('Error adding column:', error);
    }
  }, [createKanbanColumn]);

  const styles = createStyles(colors, isDarkMode);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accentPurple} />
        <Text style={styles.loadingText}>Loading board...</Text>
      </View>
    );
  }

  if (!currentWorkspace) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="grid-outline" size={64} color={colors.textTertiary} />
        <Text style={styles.emptyTitle}>No Workspace Selected</Text>
        <Text style={styles.emptySubtitle}>Select or create a workspace to view the board</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Board Header */}
      <View style={styles.header}>
        <Text style={styles.boardTitle}>{currentWorkspace.name}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.addColumnBtn} onPress={handleAddColumn}>
            <Ionicons name="add" size={20} color={colors.accentPurple} />
            <Text style={styles.addColumnText}>Add Column</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Columns */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.columnsContainer}
        decelerationRate="fast"
        snapToInterval={COLUMN_WIDTH + 12}
      >
        {/* Uncategorized/Backlog column (if has tasks) */}
        {tasksByColumn['uncategorized']?.length > 0 && (
          <KanbanColumn
            column={{ id: 'uncategorized', name: 'Uncategorized', color: '#6b7280' }}
            tasks={tasksByColumn['uncategorized']}
            onTaskPress={onTaskPress}
            onAddTask={() => onAddTask?.('uncategorized')}
            onDragStart={handleDragStart}
            onDrop={(position) => handleDrop('uncategorized', position)}
            isDragTarget={dropTargetColumn === 'uncategorized'}
            onDragOver={() => setDropTargetColumn('uncategorized')}
            onDragLeave={() => setDropTargetColumn(null)}
            draggingTask={draggingTask}
            columnWidth={COLUMN_WIDTH}
          />
        )}

        {/* Regular columns */}
        {kanbanColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByColumn[column.id] || []}
            onTaskPress={onTaskPress}
            onAddTask={() => onAddTask?.(column.id)}
            onDragStart={handleDragStart}
            onDrop={(position) => handleDrop(column.id, position)}
            isDragTarget={dropTargetColumn === column.id}
            onDragOver={() => setDropTargetColumn(column.id)}
            onDragLeave={() => setDropTargetColumn(null)}
            draggingTask={draggingTask}
            columnWidth={COLUMN_WIDTH}
          />
        ))}

        {/* Add Column Button */}
        <TouchableOpacity style={styles.addColumnCard} onPress={handleAddColumn}>
          <Ionicons name="add-circle-outline" size={32} color={colors.textTertiary} />
          <Text style={styles.addColumnCardText}>Add Column</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    boardTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    addColumnBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.accentPurple + '15',
    },
    addColumnText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.accentPurple,
    },
    columnsContainer: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 12,
    },
    addColumnCard: {
      width: 200,
      minHeight: 200,
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      borderRadius: 12,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    addColumnCardText: {
      fontSize: 14,
      color: colors.textTertiary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
    },
    loadingText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
      gap: 12,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    emptySubtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
