import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { IconButton } from "react-native-paper";

export default function TaskItem({ task, onDelete, onToggle }) {
  return (
    <View style={[styles.container, task.completed && styles.completed]}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => onToggle(task.id)}
      >
        <IconButton
          icon={
            task.completed ? "check-circle" : "checkbox-blank-circle-outline"
          }
          size={20}
          color="#4CAF50"
        />
      </TouchableOpacity>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.category}>{task.category}</Text>
      </View>

      <IconButton
        icon="delete"
        size={20}
        color="#f44336"
        onPress={() => onDelete(task.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginVertical: 4,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 2,
  },
  completed: { opacity: 0.6 },
  checkbox: { marginRight: 8 },
  textContainer: { flex: 1 },
  title: { fontSize: 16 },
  category: { fontSize: 12, color: "#666" },
});
