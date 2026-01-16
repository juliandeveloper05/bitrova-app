/**
 * Recurring Task Instance Generator
 * Task List App 2026
 * 
 * Handles automatic generation of task instances
 * based on recurring series configurations.
 */

import { 
  generateInstancesForNextDays, 
  generateSeriesId,
  dateMatchesPattern 
} from './recurringHelpers';

/**
 * Default number of days to generate instances for
 */
const DEFAULT_GENERATION_DAYS = 30;

/**
 * Maximum instances to generate per series
 */
const MAX_INSTANCES_PER_SERIES = 100;

/**
 * Generate task instances for a recurring series
 * @param {Object} series - Recurring series configuration
 * @param {Object} baseTask - Base task template
 * @param {Array} existingTasks - Existing tasks to check for duplicates
 * @param {number} [days] - Number of days to generate
 * @returns {Array} New task instances to add
 */
export const generateInstancesForSeries = (
  series,
  baseTask,
  existingTasks = [],
  days = DEFAULT_GENERATION_DAYS
) => {
  const newInstances = [];

  // Get dates for the generation period
  const dates = generateInstancesForNextDays(series.recurringConfig, days);

  // Filter out dates that already have instances
  const existingDates = new Set(
    existingTasks
      .filter(t => t.recurringSeriesId === series.id)
      .map(t => {
        if (t.instanceDate) {
          const d = new Date(t.instanceDate);
          d.setHours(0, 0, 0, 0);
          return d.toISOString();
        }
        return null;
      })
      .filter(Boolean)
  );

  for (const date of dates) {
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString();

    // Skip if instance already exists
    if (existingDates.has(dateKey)) continue;

    // Check max instances limit
    const currentInstanceCount = existingTasks.filter(
      t => t.recurringSeriesId === series.id
    ).length;
    
    if (currentInstanceCount + newInstances.length >= MAX_INSTANCES_PER_SERIES) {
      break;
    }

    // Create new instance
    const instance = {
      ...baseTask,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isRecurring: true,
      recurringSeriesId: series.id,
      instanceDate: dateKey,
      dueDate: dateKey,
      completed: false,
      skipped: false,
      notificationId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    newInstances.push(instance);
  }

  return newInstances;
};

/**
 * Generate missing instances for all recurring series
 * @param {Array} series - All recurring series
 * @param {Array} existingTasks - Existing tasks
 * @param {number} [days] - Number of days to generate
 * @returns {Array} All new instances to add
 */
export const generateAllMissingInstances = (
  series,
  existingTasks,
  days = DEFAULT_GENERATION_DAYS
) => {
  const allNewInstances = [];

  for (const s of series) {
    // Skip inactive or deleted series
    if (!s.active) continue;

    // Get the base task template from the series
    const baseTask = {
      title: s.title,
      category: s.category || 'personal',
      priority: s.priority || 'medium',
      description: s.description || '',
      enableReminder: s.enableReminder || false,
      subtasks: [],
    };

    const newInstances = generateInstancesForSeries(
      s,
      baseTask,
      [...existingTasks, ...allNewInstances],
      days
    );

    allNewInstances.push(...newInstances);
  }

  return allNewInstances;
};

/**
 * Create a new recurring series with initial instances
 * @param {Object} taskData - Task data for the series
 * @param {Object} recurringConfig - Recurrence configuration
 * @returns {{ series: Object, instances: Array }}
 */
export const createRecurringSeries = (taskData, recurringConfig) => {
  const seriesId = generateSeriesId();
  const now = new Date().toISOString();

  // Create the series record
  const series = {
    id: seriesId,
    title: taskData.title,
    category: taskData.category || 'personal',
    priority: taskData.priority || 'medium',
    description: taskData.description || '',
    enableReminder: taskData.enableReminder || false,
    recurringConfig: {
      ...recurringConfig,
      startDate: recurringConfig.startDate || now,
    },
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  // Generate initial instances
  const baseTask = {
    title: taskData.title,
    category: taskData.category || 'personal',
    priority: taskData.priority || 'medium',
    description: taskData.description || '',
    enableReminder: taskData.enableReminder || false,
    subtasks: [],
  };

  const instances = generateInstancesForSeries(series, baseTask, []);

  return { series, instances };
};

/**
 * Get count of instances that would be affected by a scope
 * @param {string} seriesId - Series ID
 * @param {Array} tasks - All tasks
 * @param {string} scope - "this" | "future" | "all"
 * @param {string} fromDate - Reference date for "future" scope
 * @returns {number}
 */
export const getAffectedInstanceCount = (seriesId, tasks, scope, fromDate = null) => {
  const seriesTasks = tasks.filter(t => t.recurringSeriesId === seriesId);
  
  switch (scope) {
    case 'this':
      return 1;
    
    case 'future':
      if (!fromDate) return seriesTasks.length;
      const refDate = new Date(fromDate);
      refDate.setHours(0, 0, 0, 0);
      return seriesTasks.filter(t => {
        const taskDate = new Date(t.instanceDate || t.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate >= refDate;
      }).length;
    
    case 'all':
      return seriesTasks.length;
    
    default:
      return 0;
  }
};

/**
 * Filter tasks by scope for update/delete operations
 * @param {Array} tasks - All tasks
 * @param {string} seriesId - Series ID
 * @param {string} scope - "this" | "future" | "all"
 * @param {string} taskId - Reference task ID (for "this" and "future")
 * @returns {{ affected: Array, remaining: Array }}
 */
export const filterTasksByScope = (tasks, seriesId, scope, taskId) => {
  const referenceTask = tasks.find(t => t.id === taskId);
  const refDate = referenceTask?.instanceDate || referenceTask?.dueDate;

  const affected = [];
  const remaining = [];

  for (const task of tasks) {
    const isInSeries = task.recurringSeriesId === seriesId;
    
    if (!isInSeries) {
      remaining.push(task);
      continue;
    }

    let shouldAffect = false;
    
    switch (scope) {
      case 'this':
        shouldAffect = task.id === taskId;
        break;
      
      case 'future':
        if (refDate && (task.instanceDate || task.dueDate)) {
          const taskDate = new Date(task.instanceDate || task.dueDate);
          const referenceDate = new Date(refDate);
          taskDate.setHours(0, 0, 0, 0);
          referenceDate.setHours(0, 0, 0, 0);
          shouldAffect = taskDate >= referenceDate;
        }
        break;
      
      case 'all':
        shouldAffect = true;
        break;
    }

    if (shouldAffect) {
      affected.push(task);
    } else {
      remaining.push(task);
    }
  }

  return { affected, remaining };
};

/**
 * Check if more instances need to be generated
 * @param {Object} series - Recurring series
 * @param {Array} tasks - Existing tasks
 * @param {number} [daysThreshold] - Days to check ahead
 * @returns {boolean}
 */
export const shouldGenerateMoreInstances = (series, tasks, daysThreshold = 7) => {
  if (!series.active) return false;

  const seriesTasks = tasks.filter(t => 
    t.recurringSeriesId === series.id && 
    !t.completed && 
    !t.skipped
  );

  if (seriesTasks.length === 0) return true;

  // Find the latest instance date
  const latestDate = seriesTasks.reduce((max, task) => {
    const date = new Date(task.instanceDate || task.dueDate);
    return date > max ? date : max;
  }, new Date(0));

  // Check if latest date is within threshold
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

  return latestDate < thresholdDate;
};
