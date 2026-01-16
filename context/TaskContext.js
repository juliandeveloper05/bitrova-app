/**
 * TaskContext - Enhanced with Recurring Tasks Support
 * Task List App 2026
 */

import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import { Platform } from "react-native";
import { loadTasks, saveTasks, loadRecurringSeries, saveRecurringSeries } from "../utils/storage";
import {
  requestNotificationPermissions,
  scheduleTaskDueDateNotification,
  cancelNotification,
} from "../utils/notifications";
import { StatsContext } from "./StatsContext";
import { 
  createRecurringSeries as createSeriesUtil,
  generateInstancesForSeries,
  filterTasksByScope,
  getAffectedInstanceCount,
} from "../utils/recurringGenerator";
import { validateRecurringConfig } from "../utils/recurringHelpers";

export const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [recurringSeries, setRecurringSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Access stats context (may be null during provider nesting)
  const statsContext = useContext(StatsContext);

  // Request notification permissions on mount
  useEffect(() => {
    const initNotifications = async () => {
      if (Platform.OS !== 'web') {
        const granted = await requestNotificationPermissions();
        setNotificationsEnabled(granted);
      }
    };
    initNotifications();
  }, []);

  // Load tasks and recurring series on startup
  useEffect(() => {
    const loadData = async () => {
      const [savedTasks, savedSeries] = await Promise.all([
        loadTasks(),
        loadRecurringSeries(),
      ]);
      
      // Ensure all tasks have required fields for backwards compatibility
      const tasksWithDefaults = savedTasks.map(task => ({
        ...task,
        subtasks: task.subtasks || [],
        isRecurring: task.isRecurring || false,
        recurringSeriesId: task.recurringSeriesId || null,
        instanceDate: task.instanceDate || null,
        skipped: task.skipped || false,
      }));
      
      setTasks(tasksWithDefaults);
      setRecurringSeries(savedSeries || []);
      setLoading(false);
    };
    loadData();
  }, []);

  // Save tasks when they change
  useEffect(() => {
    if (!loading) saveTasks(tasks);
  }, [tasks, loading]);

  // Save recurring series when they change
  useEffect(() => {
    if (!loading) saveRecurringSeries(recurringSeries);
  }, [recurringSeries, loading]);

  /**
   * Add a new task with optional notification
   */
  const addTask = useCallback(async (task) => {
    const now = new Date().toISOString();
    const newTask = { 
      ...task, 
      id: Date.now().toString(),
      notificationId: null,
      subtasks: task.subtasks || [],
      description: task.description || '',
      isRecurring: false,
      recurringSeriesId: null,
      instanceDate: null,
      skipped: false,
      createdAt: now,
      updatedAt: now,
    };

    // Schedule notification if task has due date and reminder is enabled
    if (task.dueDate && task.enableReminder && notificationsEnabled) {
      try {
        const notificationId = await scheduleTaskDueDateNotification(newTask);
        newTask.notificationId = notificationId;
      } catch (error) {
        console.error('Error scheduling notification:', error);
      }
    }

    setTasks((prev) => [...prev, newTask]);
    return newTask;
  }, [notificationsEnabled]);

  /**
   * Create a new recurring task series
   */
  const createRecurringTask = useCallback(async (taskData, recurringConfig) => {
    // Validate configuration
    const validation = validateRecurringConfig(recurringConfig);
    if (!validation.valid) {
      console.error('Invalid recurring config:', validation.errors);
      return null;
    }

    // Create series and initial instances
    const { series, instances } = createSeriesUtil(taskData, recurringConfig);

    // Schedule notifications for instances if enabled
    if (taskData.enableReminder && notificationsEnabled) {
      for (const instance of instances) {
        try {
          const notificationId = await scheduleTaskDueDateNotification(instance);
          instance.notificationId = notificationId;
        } catch (error) {
          console.error('Error scheduling notification:', error);
        }
      }
    }

    // Add series and instances
    setRecurringSeries((prev) => [...prev, series]);
    setTasks((prev) => [...prev, ...instances]);

    return { series, instances };
  }, [notificationsEnabled]);

  /**
   * Add generated recurring task instances (called by useRecurringGenerator)
   */
  const addGeneratedTasks = useCallback((newTasks) => {
    if (!newTasks || newTasks.length === 0) return;
    setTasks((prev) => [...prev, ...newTasks]);
  }, []);

  /**
   * Get all instances for a recurring series
   */
  const getRecurringSeriesInstances = useCallback((seriesId) => {
    return tasks.filter(t => t.recurringSeriesId === seriesId);
  }, [tasks]);

  /**
   * Get a recurring series by ID
   */
  const getSeriesById = useCallback((seriesId) => {
    return recurringSeries.find(s => s.id === seriesId);
  }, [recurringSeries]);

  /**
   * Get count of tasks affected by scope
   */
  const getAffectedCount = useCallback((seriesId, scope, taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const fromDate = task?.instanceDate || task?.dueDate;
    return getAffectedInstanceCount(seriesId, tasks, scope, fromDate);
  }, [tasks]);

  /**
   * Update recurring series (all, future, or single instance)
   */
  const updateRecurringSeries = useCallback(async (seriesId, updates, scope, taskId) => {
    const { affected, remaining } = filterTasksByScope(tasks, seriesId, scope, taskId);

    // Cancel notifications for affected tasks
    for (const task of affected) {
      if (task.notificationId) {
        await cancelNotification(task.notificationId);
      }
    }

    // Update affected tasks
    const updatedAffected = affected.map(task => ({
      ...task,
      ...updates,
      updatedAt: new Date().toISOString(),
      notificationId: null,
    }));

    // Re-schedule notifications if needed
    if (updates.enableReminder && updates.dueDate && notificationsEnabled) {
      for (const task of updatedAffected) {
        try {
          const notificationId = await scheduleTaskDueDateNotification(task);
          task.notificationId = notificationId;
        } catch (error) {
          console.error('Error scheduling notification:', error);
        }
      }
    }

    // Update series if updating all or future
    if (scope === 'all' || scope === 'future') {
      setRecurringSeries((prev) =>
        prev.map((s) =>
          s.id === seriesId
            ? { ...s, ...updates, updatedAt: new Date().toISOString() }
            : s
        )
      );
    }

    setTasks([...remaining, ...updatedAffected]);
  }, [tasks, notificationsEnabled]);

  /**
   * Delete recurring series instances
   */
  const deleteRecurringSeries = useCallback(async (seriesId, scope, taskId) => {
    const { affected, remaining } = filterTasksByScope(tasks, seriesId, scope, taskId);

    // Cancel notifications for affected tasks
    for (const task of affected) {
      if (task.notificationId) {
        await cancelNotification(task.notificationId);
      }
    }

    // If deleting all, remove the series
    if (scope === 'all') {
      setRecurringSeries((prev) => prev.filter((s) => s.id !== seriesId));
    } else if (scope === 'future') {
      // Mark series as inactive if deleting future
      setRecurringSeries((prev) =>
        prev.map((s) =>
          s.id === seriesId ? { ...s, active: false, updatedAt: new Date().toISOString() } : s
        )
      );
    }

    setTasks(remaining);
  }, [tasks]);

  /**
   * Skip a recurring instance
   */
  const skipRecurringInstance = useCallback(async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    
    if (task?.notificationId) {
      await cancelNotification(task.notificationId);
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, skipped: true, notificationId: null, updatedAt: new Date().toISOString() }
          : t
      )
    );
  }, [tasks]);

  /**
   * Unskip a recurring instance
   */
  const unskipRecurringInstance = useCallback(async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let notificationId = null;
    if (task.enableReminder && task.dueDate && notificationsEnabled) {
      try {
        notificationId = await scheduleTaskDueDateNotification(task);
      } catch (error) {
        console.error('Error scheduling notification:', error);
      }
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, skipped: false, notificationId, updatedAt: new Date().toISOString() }
          : t
      )
    );
  }, [tasks, notificationsEnabled]);

  /**
   * Delete a task and cancel its notification
   */
  const deleteTask = useCallback(async (id) => {
    const taskToDelete = tasks.find((task) => task.id === id);
    
    // Cancel notification if exists
    if (taskToDelete?.notificationId) {
      await cancelNotification(taskToDelete.notificationId);
    }

    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, [tasks]);

  /**
   * Toggle task completion
   * Cancels notification when task is completed
   */
  const toggleCompleted = useCallback(async (id) => {
    const task = tasks.find((t) => t.id === id);
    
    // If completing and has notification, cancel it
    if (task && !task.completed && task.notificationId) {
      await cancelNotification(task.notificationId);
    }

    // Record task completion in stats
    if (task && !task.completed && statsContext?.recordTaskCompleted) {
      statsContext.recordTaskCompleted();
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === id 
          ? { ...task, completed: !task.completed, notificationId: task.completed ? task.notificationId : null } 
          : task
      )
    );
  }, [tasks, statsContext]);

  /**
   * Update a task
   */
  const updateTask = useCallback(async (id, updates) => {
    const existingTask = tasks.find((t) => t.id === id);
    if (!existingTask) return;

    let notificationId = existingTask.notificationId;

    // If due date changed and reminder is enabled, reschedule notification
    if (updates.dueDate !== existingTask.dueDate) {
      // Cancel old notification
      if (notificationId) {
        await cancelNotification(notificationId);
        notificationId = null;
      }

      // Schedule new notification if due date exists and reminder enabled
      if (updates.dueDate && updates.enableReminder && notificationsEnabled) {
        try {
          notificationId = await scheduleTaskDueDateNotification({
            ...existingTask,
            ...updates,
          });
        } catch (error) {
          console.error('Error rescheduling notification:', error);
        }
      }
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, ...updates, notificationId, updatedAt: new Date().toISOString() } : task
      )
    );
  }, [tasks, notificationsEnabled]);

  /**
   * Get task statistics
   */
  const getStats = useCallback(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const highPriority = tasks.filter((t) => !t.completed && t.priority === 'high').length;
    const overdue = tasks.filter((t) => {
      if (t.completed || !t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDate < today;
    }).length;
    const recurring = tasks.filter((t) => t.isRecurring).length;
    const skipped = tasks.filter((t) => t.skipped).length;

    return { total, completed, pending, highPriority, overdue, recurring, skipped };
  }, [tasks]);

  /**
   * Add a subtask to a task
   */
  const addSubtask = useCallback((taskId, title) => {
    if (!title.trim()) return null;
    
    const newSubtask = {
      id: Date.now().toString(),
      title: title.trim(),
      completed: false,
    };

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, subtasks: [...(task.subtasks || []), newSubtask] }
          : task
      )
    );

    return newSubtask;
  }, []);

  /**
   * Toggle subtask completion
   */
  const toggleSubtask = useCallback((taskId, subtaskId) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: (task.subtasks || []).map((st) =>
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
              ),
            }
          : task
      )
    );
  }, []);

  /**
   * Delete a subtask
   */
  const deleteSubtask = useCallback((taskId, subtaskId) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: (task.subtasks || []).filter((st) => st.id !== subtaskId),
            }
          : task
      )
    );
  }, []);

  /**
   * Get subtask progress for a task
   */
  const getSubtaskProgress = useCallback((taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.subtasks || task.subtasks.length === 0) {
      return { total: 0, completed: 0, percentage: 0 };
    }
    const total = task.subtasks.length;
    const completed = task.subtasks.filter((st) => st.completed).length;
    return {
      total,
      completed,
      percentage: Math.round((completed / total) * 100),
    };
  }, [tasks]);

  /**
   * Update a subtask's title
   */
  const updateSubtask = useCallback((taskId, subtaskId, updates) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              updatedAt: new Date().toISOString(),
              subtasks: (task.subtasks || []).map((st) =>
                st.id === subtaskId ? { ...st, ...updates } : st
              ),
            }
          : task
      )
    );
  }, []);

  /**
   * Reorder subtasks within a task
   */
  const reorderSubtasks = useCallback((taskId, fromIndex, toIndex) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        
        const subtasks = [...(task.subtasks || [])];
        const [movedItem] = subtasks.splice(fromIndex, 1);
        subtasks.splice(toIndex, 0, movedItem);
        
        return {
          ...task,
          updatedAt: new Date().toISOString(),
          subtasks,
        };
      })
    );
  }, []);

  return (
    <TaskContext.Provider
      value={{ 
        tasks, 
        recurringSeries,
        addTask, 
        deleteTask, 
        toggleCompleted, 
        updateTask,
        getStats,
        // Recurring task methods
        createRecurringTask,
        addGeneratedTasks,
        getRecurringSeriesInstances,
        getSeriesById,
        getAffectedCount,
        updateRecurringSeries,
        deleteRecurringSeries,
        skipRecurringInstance,
        unskipRecurringInstance,
        // Subtask methods
        addSubtask,
        toggleSubtask,
        deleteSubtask,
        updateSubtask,
        reorderSubtasks,
        getSubtaskProgress,
        loading,
        notificationsEnabled,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};
