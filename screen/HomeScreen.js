import React, { useContext, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import { TaskContext } from "../context/TaskContext";
import { useNavigation } from "@react-navigation/native";
import { IconButton } from "react-native-paper";

const TaskItem = ({ task, onDelete, onToggle }) => (
  <View style={styles.taskItem}>
    <TouchableOpacity onPress={() => onToggle(task.id)}>
      <Text style={[styles.taskText, task.completed && styles.completedTask]}>
        {task.title}
      </Text>
    </TouchableOpacity>
    <IconButton icon="delete" size={24} onPress={() => onDelete(task.id)} />
  </View>
);

export default function HomeScreen() {
  const navigation = useNavigation();
  const { tasks, deleteTask, toggleCompleted } = useContext(TaskContext);
  const [selectedCategory, setSelectedCategory] = useState("all");

  if (!tasks) {
    return (
      <View style={styles.container}>
        <Text>Cargando tareas...</Text>
      </View>
    );
  }

  const filteredTasks =
    selectedCategory === "all"
      ? tasks
      : tasks.filter((task) => task.category === selectedCategory);

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {Object.entries(categories).map(([key, value]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.categoryButton,
              selectedCategory === key && styles.selectedCategory,
            ]}
            onPress={() => setSelectedCategory(key)}
          >
            <Text style={styles.categoryText}>{value.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onDelete={deleteTask}
            onToggle={toggleCompleted}
          />
        )}
      />

      <IconButton
        icon="plus"
        size={30}
        style={styles.fab}
        onPress={() => navigation.navigate("AddTask")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: 16,
    flexWrap: "wrap",
  },
  categoryButton: {
    padding: 8,
    margin: 4,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },
  selectedCategory: {
    backgroundColor: "#90caf9",
  },
  categoryText: {
    color: "#333",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#2196f3",
    borderRadius: 28,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f5f5f5",
    marginBottom: 8,
    borderRadius: 8,
    justifyContent: "space-between",
  },
  taskText: {
    fontSize: 16,
    color: "#333",
  },
  completedTask: {
    textDecorationLine: "line-through",
    color: "#888",
  },
});
