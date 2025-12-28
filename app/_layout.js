import { Stack } from "expo-router";
import { TaskProvider } from "../context/TaskContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { StatusBar } from "expo-status-bar";

// Inner component that uses theme context
function RootLayoutNav() {
  const { isDarkMode, colors } = useTheme();

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
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
        <Stack.Screen 
          name="task-details" 
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen 
          name="settings" 
          options={{
            animation: "slide_from_right",
          }}
        />
      </Stack>
    </>
  );
}

// Main layout that provides theme context
export default function Layout() {
  return (
    <ThemeProvider>
      <TaskProvider>
        <RootLayoutNav />
      </TaskProvider>
    </ThemeProvider>
  );
}