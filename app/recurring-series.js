/**
 * Recurring Series View Screen
 * Task List App 2026
 * 
 * Displays all instances of a recurring task series
 * with filters (all, completed, pending) and series info.
 */

import React, { useState, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInUp, 
  FadeInRight,
  Layout,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { TaskContext } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, typography, priorities, categories } from '../constants/theme';
import { formatRecurrencePreview, DAYS_OF_WEEK } from '../utils/recurringHelpers';
import TaskCard from '../components/TaskCard';

// Filter options
const FILTERS = {
  ALL: 'all',
  PENDING: 'pending',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
};

const FilterTab = ({ id, label, count, selected, onPress, colors }) => (
  <Pressable
    style={[
      styles.filterTab,
      { 
        backgroundColor: selected ? colors.accentCyan + '20' : colors.glassMedium,
        borderColor: selected ? colors.accentCyan : colors.glassBorder,
      }
    ]}
    onPress={onPress}
  >
    <Text style={[
      styles.filterLabel,
      { color: selected ? colors.accentCyan : colors.textSecondary }
    ]}>
      {label}
    </Text>
    <View style={[
      styles.filterCount,
      { backgroundColor: selected ? colors.accentCyan : colors.glassLight }
    ]}>
      <Text style={[
        styles.filterCountText,
        { color: selected ? colors.bgPrimary : colors.textSecondary }
      ]}>
        {count}
      </Text>
    </View>
  </Pressable>
);

export default function RecurringSeries() {
  const router = useRouter();
  const { seriesId } = useLocalSearchParams();
  const { 
    tasks, 
    recurringSeries, 
    getRecurringSeriesInstances,
    toggleCompleted,
    deleteTask,
  } = useContext(TaskContext);
  const { colors } = useTheme();
  
  const [activeFilter, setActiveFilter] = useState(FILTERS.ALL);
  
  // Get series configuration
  const series = recurringSeries.find(s => s.id === seriesId);
  
  // Get all instances for this series
  const allInstances = useMemo(() => {
    if (!seriesId) return [];
    return tasks
      .filter(t => t.recurringSeriesId === seriesId)
      .sort((a, b) => {
        const dateA = new Date(a.instanceDate || a.dueDate);
        const dateB = new Date(b.instanceDate || b.dueDate);
        return dateA - dateB;
      });
  }, [tasks, seriesId]);
  
  // Filter instances based on active filter
  const filteredInstances = useMemo(() => {
    switch (activeFilter) {
      case FILTERS.PENDING:
        return allInstances.filter(t => !t.completed && !t.skipped);
      case FILTERS.COMPLETED:
        return allInstances.filter(t => t.completed);
      case FILTERS.SKIPPED:
        return allInstances.filter(t => t.skipped);
      default:
        return allInstances;
    }
  }, [allInstances, activeFilter]);
  
  // Count for each filter
  const counts = useMemo(() => ({
    all: allInstances.length,
    pending: allInstances.filter(t => !t.completed && !t.skipped).length,
    completed: allInstances.filter(t => t.completed).length,
    skipped: allInstances.filter(t => t.skipped).length,
  }), [allInstances]);
  
  // Get priority and category from series
  const priority = priorities[series?.priority] || priorities.medium;
  const category = categories[series?.category] || categories.personal;
  
  // Format recurrence pattern
  const recurrenceText = series?.recurringConfig 
    ? formatRecurrencePreview(series.recurringConfig)
    : 'Tarea recurrente';
  
  // Group instances by month
  const groupedInstances = useMemo(() => {
    const groups = {};
    filteredInstances.forEach(instance => {
      const date = new Date(instance.instanceDate || instance.dueDate);
      const monthKey = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(instance);
    });
    return groups;
  }, [filteredInstances]);

  if (!series) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgPrimary }, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.textTertiary} />
        <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
          Serie no encontrada
        </Text>
        <Pressable 
          style={[styles.backLink, { backgroundColor: colors.glassMedium }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backLinkText, { color: colors.accentCyan }]}>
            Volver
          </Text>
        </Pressable>
      </View>
    );
  }

  const handleToggle = (taskId) => {
    toggleCompleted(taskId);
  };

  const handleDelete = (taskId) => {
    deleteTask(taskId);
  };

  const handlePress = (taskId) => {
    router.push(`/task-details?taskId=${taskId}`);
  };

  const renderInstance = ({ item, index }) => (
    <Animated.View
      entering={FadeInUp.delay(index * 50).springify()}
      layout={Layout.springify()}
    >
      <TaskCard
        task={item}
        onToggle={() => handleToggle(item.id)}
        onDelete={() => handleDelete(item.id)}
        onPress={() => handlePress(item.id)}
      />
    </Animated.View>
  );

  const renderMonthHeader = (month) => (
    <Animated.View 
      style={styles.monthHeader}
      entering={FadeInUp.springify()}
    >
      <View style={[styles.monthLine, { backgroundColor: colors.glassBorder }]} />
      <Text style={[styles.monthLabel, { color: colors.textTertiary }]}>
        {month}
      </Text>
      <View style={[styles.monthLine, { backgroundColor: colors.glassBorder }]} />
    </Animated.View>
  );

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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Serie Recurrente
        </Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Series Info Card */}
      <Animated.View 
        style={[styles.seriesCard, { backgroundColor: colors.glassMedium, borderColor: colors.glassBorder }]}
        entering={FadeInUp.delay(100).springify()}
      >
        {/* Priority indicator */}
        <View style={[styles.priorityLine, { backgroundColor: priority.color }]} />
        
        <View style={styles.seriesContent}>
          <View style={styles.seriesHeader}>
            <View style={[styles.seriesIcon, { backgroundColor: colors.accentCyan + '20' }]}>
              <Ionicons name="repeat" size={24} color={colors.accentCyan} />
            </View>
            <View style={styles.seriesTitleContainer}>
              <Text style={[styles.seriesTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {series.title}
              </Text>
              <Text style={[styles.seriesRecurrence, { color: colors.textSecondary }]}>
                {recurrenceText}
              </Text>
            </View>
          </View>
          
          <View style={styles.seriesMeta}>
            {/* Category badge */}
            <View style={[styles.badge, { backgroundColor: category.color + '20' }]}>
              <Ionicons name={category.icon} size={12} color={category.color} />
              <Text style={[styles.badgeText, { color: category.color }]}>
                {category.name}
              </Text>
            </View>
            
            {/* Priority badge */}
            <View style={[styles.badge, { backgroundColor: priority.color + '20' }]}>
              <Ionicons name={priority.icon} size={12} color={priority.color} />
              <Text style={[styles.badgeText, { color: priority.color }]}>
                {priority.name}
              </Text>
            </View>
            
            {/* Instance count */}
            <View style={[styles.badge, { backgroundColor: colors.glassLight }]}>
              <Ionicons name="layers-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                {allInstances.length} instancias
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Filter Tabs */}
      <Animated.View 
        style={styles.filterContainer}
        entering={FadeInUp.delay(150).springify()}
      >
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <FilterTab
            id={FILTERS.ALL}
            label="Todas"
            count={counts.all}
            selected={activeFilter === FILTERS.ALL}
            onPress={() => setActiveFilter(FILTERS.ALL)}
            colors={colors}
          />
          <FilterTab
            id={FILTERS.PENDING}
            label="Pendientes"
            count={counts.pending}
            selected={activeFilter === FILTERS.PENDING}
            onPress={() => setActiveFilter(FILTERS.PENDING)}
            colors={colors}
          />
          <FilterTab
            id={FILTERS.COMPLETED}
            label="Completadas"
            count={counts.completed}
            selected={activeFilter === FILTERS.COMPLETED}
            onPress={() => setActiveFilter(FILTERS.COMPLETED)}
            colors={colors}
          />
          {counts.skipped > 0 && (
            <FilterTab
              id={FILTERS.SKIPPED}
              label="Saltadas"
              count={counts.skipped}
              selected={activeFilter === FILTERS.SKIPPED}
              onPress={() => setActiveFilter(FILTERS.SKIPPED)}
              colors={colors}
            />
          )}
        </ScrollView>
      </Animated.View>

      {/* Instances List */}
      {filteredInstances.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons 
            name={activeFilter === FILTERS.COMPLETED ? "checkmark-done-circle-outline" : "calendar-outline"} 
            size={64} 
            color={colors.textTertiary} 
          />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            {activeFilter === FILTERS.ALL 
              ? 'No hay instancias'
              : activeFilter === FILTERS.COMPLETED
                ? 'Sin tareas completadas'
                : 'Sin tareas pendientes'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredInstances}
          renderItem={renderInstance}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
    paddingHorizontal: spacing.xl,
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
  placeholder: {
    width: 40,
  },
  seriesCard: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  priorityLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  seriesContent: {
    padding: spacing.lg,
    paddingLeft: spacing.lg + 8,
  },
  seriesHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  seriesIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seriesTitleContainer: {
    flex: 1,
  },
  seriesTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 4,
  },
  seriesRecurrence: {
    fontSize: typography.fontSize.sm,
  },
  seriesMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  filterContainer: {
    marginBottom: spacing.md,
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  filterCount: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  filterCountText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.lg,
  },
  monthLine: {
    flex: 1,
    height: 1,
  },
  monthLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'capitalize',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  backLink: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  backLinkText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
});
