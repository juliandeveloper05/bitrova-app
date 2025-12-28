/**
 * TaskContext - Enhanced with Notifications and Subtasks
 * Task List App 2026
 */

import React, { createContext, useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import { loadTasks, saveTasks } from "../utils/storage";
import {
  requestNotificationPermissions,
  scheduleTaskDueDateNotification,
  cancelNotification,
} from "../utils/notifications";

export const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

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

  // Load tasks on startup
  useEffect(() => {
    const loadData = async () => {
      const savedTasks = await loadTasks();
      // Ensure all tasks have subtasks array for backwards compatibility
      const tasksWithSubtasks = savedTasks.map(task => ({
        ...task,
        subtasks: task.subtasks || [],
      }));
      setTasks(tasksWithSubtasks);
      setLoading(false);
    };
    loadData();
  }, []);

  // Save tasks when they change
  useEffect(() => {
    if (!loading) saveTasks(tasks);
  }, [tasks, loading]);

  /**
   * Add a new task with optional notification
   */
  const addTask = useCallback(async (task) => {
    const newTask = { 
      ...task, 
      id: Date.now().toString(),
      notificationId: null,
      subtasks: task.subtasks || [],
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

    setTasks((prev) =>
      prev.map((task) =>
        task.id === id 
          ? { ...task, completed: !task.completed, notificationId: task.completed ? task.notificationId : null } 
          : task
      )
    );
  }, [tasks]);

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
        task.id === id ? { ...task, ...updates, notificationId } : task
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

    return { total, completed, pending, highPriority, overdue };
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

  return (
    <TaskContext.Provider
      value={{ 
        tasks, 
        addTask, 
        deleteTask, 
        toggleCompleted, 
        updateTask,
        getStats,
        addSubtask,
        toggleSubtask,
        deleteSubtask,
        getSubtaskProgress,
        loading,
        notificationsEnabled,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};
