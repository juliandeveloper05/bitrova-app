/**
 * Home Screen - Task List App 2026
 * Modern Premium Design with Glassmorphism
 */

import React, { useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInUp, LinearTransition } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { TaskContext } from '../context/TaskContext';
import { colors, spacing, typography } from '../constants/theme';

// Components
import Header from '../components/Header';
import StatsWidget from '../components/StatsWidget';
import CategoryFilter from '../components/CategoryFilter';
import TaskCard from '../components/TaskCard';
import FAB from '../components/FAB';

export default function Index() {
  const navigation = useNavigation();
  const { tasks, deleteTask, toggleCompleted, loading } = useContext(TaskContext);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Filter tasks by category
  const filteredTasks = selectedCategory === 'all'
    ? tasks
    : tasks.filter(task => task.category === selectedCategory);

  // Separate completed and pending
  const pendingTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  // Pull to refresh simulation
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Render task section header
  const renderSectionHeader = (title, count) => (
    <Animated.View 
      style={styles.sectionHeader}
      entering={FadeInUp.springify()}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{count}</Text>
      </View>
    </Animated.View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <Animated.View 
      style={styles.emptyState}
      entering={FadeInUp.delay(300).springify()}
    >
      <Text style={styles.emptyEmoji}>🎯</Text>
      <Text style={styles.emptyTitle}>¡Todo listo!</Text>
      <Text style={styles.emptySubtitle}>
        No tienes tareas pendientes.{'\n'}Toca + para agregar una nueva.
      </Text>
    </Animated.View>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />
      
      {/* Header with greeting */}
      <Header />
      
      {/* Stats Widget */}
      <StatsWidget tasks={tasks} />
      
      {/* Category Filter */}
      <CategoryFilter 
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />
      
      {/* Task List */}
      <FlatList
        data={[...pendingTasks, ...completedTasks]}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.accentPurple}
            colors={[colors.accentPurple]}
          />
        }
        ListHeaderComponent={() => (
          pendingTasks.length > 0 && renderSectionHeader('Pendientes', pendingTasks.length)
        )}
        ListEmptyComponent={renderEmptyState}
        renderItem={({ item, index }) => (
          <>
            {/* Section header for completed tasks */}
            {index === pendingTasks.length && completedTasks.length > 0 && (
              renderSectionHeader('Completadas', completedTasks.length)
            )}
            <Animated.View
              entering={FadeInUp.delay(index * 50).springify()}
              layout={LinearTransition.springify()}
            >
              <TaskCard
                task={item}
                onToggle={toggleCompleted}
                onDelete={deleteTask}
                onPress={() => console.log('Task pressed:', item.id)}
              />
            </Animated.View>
          </>
        )}
      />
      
      {/* Floating Action Button */}
      <FAB onPress={() => navigation.navigate('add-task')} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  
  listContent: {
    paddingBottom: 100,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  countBadge: {
    marginLeft: spacing.sm,
    backgroundColor: colors.glassMedium,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.sm,
  },
  
  countText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  
  emptySubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
