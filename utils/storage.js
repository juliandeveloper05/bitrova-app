import AsyncStorage from "@react-native-async-storage/async-storage";

const TASKS_KEY = "@tasks";
const RECURRING_SERIES_KEY = "@recurring_series";

export const loadTasks = async () => {
  try {
    const saved = await AsyncStorage.getItem(TASKS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Error loading tasks:", error);
    return [];
  }
};

export const saveTasks = async (tasks) => {
  try {
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Error saving tasks:", error);
  }
};

/**
 * Load recurring series configurations
 * @returns {Promise<Array>} Array of recurring series
 */
export const loadRecurringSeries = async () => {
  try {
    const saved = await AsyncStorage.getItem(RECURRING_SERIES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Error loading recurring series:", error);
    return [];
  }
};

/**
 * Save recurring series configurations
 * @param {Array} series - Array of recurring series
 */
export const saveRecurringSeries = async (series) => {
  try {
    await AsyncStorage.setItem(RECURRING_SERIES_KEY, JSON.stringify(series));
  } catch (error) {
    console.error("Error saving recurring series:", error);
  }
};

/**
 * Clear all recurring series (for testing/reset)
 */
export const clearRecurringSeries = async () => {
  try {
    await AsyncStorage.removeItem(RECURRING_SERIES_KEY);
  } catch (error) {
    console.error("Error clearing recurring series:", error);
  }
};
