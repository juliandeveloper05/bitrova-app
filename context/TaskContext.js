import React, { createContext, useState, useEffect } from "react";
import { loadTasks, saveTasks } from "../utils/storage";

export const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar tareas al iniciar
  useEffect(() => {
    const loadData = async () => {
      const savedTasks = await loadTasks();
      setTasks(savedTasks);
      setLoading(false);
    };
    loadData();
  }, []);

  // Guardar tareas cuando cambian
  useEffect(() => {
    if (!loading) saveTasks(tasks);
  }, [tasks]);

  const addTask = (task) => {
    setTasks([...tasks, { ...task, id: Date.now().toString() }]);
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const toggleCompleted = (id) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <TaskContext.Provider
      value={{ tasks, addTask, deleteTask, toggleCompleted, loading }}
    >
      {children}
    </TaskContext.Provider>
  );
};
