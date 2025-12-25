import { Stack } from "expo-router";
import { TaskProvider } from "../context/TaskContext";
import { StatusBar } from "expo-status-bar";
import { colors } from "../constants/theme";

export default function Layout() {
  return (
    <TaskProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bgPrimary },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen 
          name="add-task" 
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
      </Stack>
    </TaskProvider>
  );
}
