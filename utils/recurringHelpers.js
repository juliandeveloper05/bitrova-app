/**
 * Recurring Tasks Helpers
 * Task List App 2026
 * 
 * Utility functions for calculating recurrence patterns
 * and generating instance dates.
 */

/**
 * Recurrence pattern types
 */
export const RECURRENCE_PATTERNS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
};

/**
 * Day of week mapping (1 = Monday, 7 = Sunday)
 */
export const DAYS_OF_WEEK = {
  1: { short: 'L', long: 'Lunes' },
  2: { short: 'M', long: 'Martes' },
  3: { short: 'X', long: 'Miércoles' },
  4: { short: 'J', long: 'Jueves' },
  5: { short: 'V', long: 'Viernes' },
  6: { short: 'S', long: 'Sábado' },
  7: { short: 'D', long: 'Domingo' },
};

/**
 * Default recurring configuration
 */
export const DEFAULT_RECURRING_CONFIG = {
  pattern: RECURRENCE_PATTERNS.WEEKLY,
  frequency: 1,
  daysOfWeek: [], // [1, 3, 5] for Mon, Wed, Fri
  dayOfMonth: null, // 1-31 for monthly
  startDate: null, // ISO string
  endDate: null, // null = infinite, or ISO string
  endAfterOccurrences: null, // number or null
};

/**
 * Validate a recurring configuration
 * @param {Object} config - Recurring configuration object
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validateRecurringConfig = (config) => {
  const errors = [];

  if (!config) {
    return { valid: false, errors: ['Configuration is required'] };
  }

  if (!Object.values(RECURRENCE_PATTERNS).includes(config.pattern)) {
    errors.push('Invalid recurrence pattern');
  }

  if (!config.frequency || config.frequency < 1) {
    errors.push('Frequency must be at least 1');
  }

  if (config.pattern === RECURRENCE_PATTERNS.WEEKLY) {
    if (!config.daysOfWeek || config.daysOfWeek.length === 0) {
      errors.push('At least one day of week must be selected for weekly pattern');
    }
  }

  if (config.pattern === RECURRENCE_PATTERNS.MONTHLY) {
    if (!config.dayOfMonth || config.dayOfMonth < 1 || config.dayOfMonth > 31) {
      errors.push('Day of month must be between 1 and 31');
    }
  }

  if (!config.startDate) {
    errors.push('Start date is required');
  }

  if (config.endDate && config.startDate) {
    const start = new Date(config.startDate);
    const end = new Date(config.endDate);
    if (end < start) {
      errors.push('End date must be after start date');
    }
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Get day of week (1-7, Monday = 1)
 * @param {Date} date 
 * @returns {number}
 */
const getDayOfWeek = (date) => {
  const day = date.getDay();
  return day === 0 ? 7 : day; // Convert Sunday (0) to 7
};

/**
 * Calculate the next occurrence date based on recurrence config
 * @param {Object} config - Recurring configuration
 * @param {Date|string} fromDate - Starting point for calculation
 * @returns {Date|null} - Next occurrence date or null if no more occurrences
 */
export const calculateNextOccurrence = (config, fromDate) => {
  const { pattern, frequency, daysOfWeek, dayOfMonth, endDate, endAfterOccurrences } = config;
  const current = new Date(fromDate);
  current.setHours(0, 0, 0, 0);

  let nextDate = new Date(current);

  switch (pattern) {
    case RECURRENCE_PATTERNS.DAILY:
      nextDate.setDate(nextDate.getDate() + frequency);
      break;

    case RECURRENCE_PATTERNS.WEEKLY:
      if (!daysOfWeek || daysOfWeek.length === 0) return null;
      
      // Sort days for consistent iteration
      const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
      const currentDayOfWeek = getDayOfWeek(current);
      
      // Find next day in the same week
      let foundInSameWeek = false;
      for (const day of sortedDays) {
        if (day > currentDayOfWeek) {
          const daysToAdd = day - currentDayOfWeek;
          nextDate.setDate(nextDate.getDate() + daysToAdd);
          foundInSameWeek = true;
          break;
        }
      }
      
      // If not found, go to first day of next week(s)
      if (!foundInSameWeek) {
        const daysUntilNextWeek = 7 - currentDayOfWeek + sortedDays[0];
        const weeksToAdd = (frequency - 1) * 7;
        nextDate.setDate(nextDate.getDate() + daysUntilNextWeek + weeksToAdd);
      }
      break;

    case RECURRENCE_PATTERNS.MONTHLY:
      nextDate.setMonth(nextDate.getMonth() + frequency);
      if (dayOfMonth) {
        // Handle months with fewer days (e.g., Feb 30 → Feb 28)
        const maxDay = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
        nextDate.setDate(Math.min(dayOfMonth, maxDay));
      }
      break;

    case RECURRENCE_PATTERNS.CUSTOM:
      // Custom uses daily with custom frequency
      nextDate.setDate(nextDate.getDate() + frequency);
      break;

    default:
      return null;
  }

  // Check end date constraint
  if (endDate) {
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);
    if (nextDate > endDateObj) {
      return null;
    }
  }

  return nextDate;
};

/**
 * Generate all occurrence dates within a date range
 * @param {Object} config - Recurring configuration
 * @param {Date|string} rangeStart - Start of range
 * @param {Date|string} rangeEnd - End of range
 * @param {number} [maxOccurrences=100] - Maximum occurrences to generate
 * @returns {Date[]} - Array of occurrence dates
 */
export const generateDateRange = (config, rangeStart, rangeEnd, maxOccurrences = 100) => {
  const dates = [];
  const start = new Date(rangeStart);
  const end = new Date(rangeEnd);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  // Start from config.startDate if it's after rangeStart
  let currentDate = new Date(config.startDate);
  currentDate.setHours(0, 0, 0, 0);

  // If startDate is before rangeStart, find first occurrence in range
  while (currentDate < start && dates.length < maxOccurrences) {
    const next = calculateNextOccurrence(config, currentDate);
    if (!next) break;
    currentDate = next;
  }

  // For weekly pattern, we need to check each day in daysOfWeek
  if (config.pattern === RECURRENCE_PATTERNS.WEEKLY && config.daysOfWeek?.length > 0) {
    // Check if the start date falls on one of the selected days
    const startDayOfWeek = getDayOfWeek(currentDate);
    if (config.daysOfWeek.includes(startDayOfWeek) && currentDate >= start && currentDate <= end) {
      dates.push(new Date(currentDate));
    }
  } else {
    // For other patterns, add start date if it's in range
    if (currentDate >= start && currentDate <= end) {
      dates.push(new Date(currentDate));
    }
  }

  // Generate subsequent occurrences
  while (dates.length < maxOccurrences) {
    const next = calculateNextOccurrence(config, currentDate);
    if (!next || next > end) break;
    
    dates.push(new Date(next));
    currentDate = next;
  }

  return dates;
};

/**
 * Generate instances for the next N days
 * @param {Object} config - Recurring configuration
 * @param {number} [days=30] - Number of days from today
 * @returns {Date[]}
 */
export const generateInstancesForNextDays = (config, days = 30) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endRange = new Date(today);
  endRange.setDate(endRange.getDate() + days);
  
  return generateDateRange(config, today, endRange);
};

/**
 * Format recurrence configuration as human-readable text
 * @param {Object} config - Recurring configuration
 * @returns {string}
 */
export const formatRecurrencePreview = (config) => {
  if (!config) return '';

  const { pattern, frequency, daysOfWeek, dayOfMonth } = config;

  switch (pattern) {
    case RECURRENCE_PATTERNS.DAILY:
      if (frequency === 1) return 'Se repite todos los días';
      return `Se repite cada ${frequency} días`;

    case RECURRENCE_PATTERNS.WEEKLY:
      if (!daysOfWeek || daysOfWeek.length === 0) return 'Se repite semanalmente';
      
      const dayNames = daysOfWeek
        .sort((a, b) => a - b)
        .map(d => DAYS_OF_WEEK[d]?.short || '')
        .filter(Boolean);
      
      if (frequency === 1) {
        return `Se repite cada ${dayNames.join(', ')}`;
      }
      return `Se repite cada ${frequency} semanas (${dayNames.join(', ')})`;

    case RECURRENCE_PATTERNS.MONTHLY:
      const dayStr = dayOfMonth ? `el día ${dayOfMonth}` : '';
      if (frequency === 1) return `Se repite mensualmente ${dayStr}`;
      return `Se repite cada ${frequency} meses ${dayStr}`;

    case RECURRENCE_PATTERNS.CUSTOM:
      return `Se repite cada ${frequency} días`;

    default:
      return 'Configuración de recurrencia';
  }
};

/**
 * Generate a unique series ID
 * @returns {string}
 */
export const generateSeriesId = () => {
  return `series_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if a date matches the recurrence pattern
 * @param {Object} config - Recurring configuration
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export const dateMatchesPattern = (config, date) => {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  const startDate = new Date(config.startDate);
  startDate.setHours(0, 0, 0, 0);
  
  if (checkDate < startDate) return false;
  
  if (config.endDate) {
    const endDate = new Date(config.endDate);
    endDate.setHours(23, 59, 59, 999);
    if (checkDate > endDate) return false;
  }

  switch (config.pattern) {
    case RECURRENCE_PATTERNS.DAILY:
      const daysDiff = Math.floor((checkDate - startDate) / (1000 * 60 * 60 * 24));
      return daysDiff % config.frequency === 0;

    case RECURRENCE_PATTERNS.WEEKLY:
      const dayOfWeek = getDayOfWeek(checkDate);
      return config.daysOfWeek?.includes(dayOfWeek) || false;

    case RECURRENCE_PATTERNS.MONTHLY:
      return checkDate.getDate() === config.dayOfMonth;

    default:
      return false;
  }
};
