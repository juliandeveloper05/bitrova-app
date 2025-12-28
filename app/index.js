/**
 * Home Screen - Task List App 2025
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
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, LinearTransition } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { TaskContext } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography } from '../constants/theme';

// Components
import Header from '../components/Header';
import StatsWidget from '../components/StatsWidget';
import CategoryFilter from '../components/CategoryFilter';
import TaskCard from '../components/TaskCard';
import FAB from '../components/FAB';
import SearchBar from '../components/SearchBar';

export default function Index() {
  const router = useRouter();
  const { tasks, deleteTask, toggleCompleted, loading } = useContext(TaskContext);
  const { isDarkMode, colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tasks by category
  const categoryFilteredTasks = selectedCategory === 'all'
    ? tasks
    : tasks.filter(task => task.category === selectedCategory);

  // Filter tasks by search query
  const filteredTasks = searchQuery.trim() === ''
    ? categoryFilteredTasks
    : categoryFilteredTasks.filter(task => {
        const query = searchQuery.toLowerCase();
        const titleMatch = task.title?.toLowerCase().includes(query);
        const descriptionMatch = task.description?.toLowerCase().includes(query);
        return titleMatch || descriptionMatch;
      });

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
      style={[styles.sectionHeader]}
      entering={FadeInUp.springify()}
    >
      <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{title}</Text>
      <View style={[styles.countBadge, { backgroundColor: colors.glassMedium }]}>
        <Text style={[styles.countText, { color: colors.textSecondary }]}>{count}</Text>
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
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>¡Todo listo!</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        No tienes tareas pendientes.{'\n'}Toca + para agregar una nueva.
      </Text>
    </Animated.View>
  );

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.bgPrimary} />
      
      {/* Header with greeting */}
      <Header />
      
      {/* Stats Widget */}
      <StatsWidget tasks={tasks} />
      
      {/* Category Filter */}
      <CategoryFilter 
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />
      
      {/* Search Bar */}
      <SearchBar 
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar tareas..."
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
                onPress={() => router.push(`/task-details?taskId=${item.id}`)}
              />
            </Animated.View>
          </>
        )}
      />
      
      {/* Floating Action Button */}
      <FAB onPress={() => router.push('/add-task')} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  countBadge: {
    marginLeft: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.sm,
  },
  
  countText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
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
    marginBottom: spacing.sm,
  },
  
  emptySubtitle: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    lineHeight: 24,
  },
});