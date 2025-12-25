import AsyncStorage from "@react-native-async-storage/async-storage";

const TASKS_KEY = "@tasks";

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
