import { Stack } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { TaskProvider } from "../context/TaskContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { PomodoroProvider } from "../context/PomodoroContext";
import { StatsProvider } from "../context/StatsContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { SubscriptionProvider } from "../context/SubscriptionContext";
import { OrganizationProvider } from "../context/OrganizationContext";
import { WorkspaceProvider } from "../context/WorkspaceContext";
import { StatusBar } from "expo-status-bar";
import AuthScreen from "./auth";

// Loading screen while checking auth
function LoadingScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPrimary }}>
      <ActivityIndicator size="large" color={colors.accentPurple} />
    </View>
  );
}

// Inner component that uses theme context and checks auth
function RootLayoutNav() {
  const { isDarkMode, colors } = useTheme();
  const auth = useAuth();

  // Show loading while checking auth state
  if (auth.loading) {
    return <LoadingScreen />;
  }

  // Show auth screen if not authenticated
  if (!auth.isAuthenticated) {
    return (
      <>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <AuthScreen />
      </>
    );
  }

  // Show main app if authenticated
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
        <Stack.Screen 
          name="pomodoro" 
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen 
          name="stats" 
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen 
          name="analytics" 
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen 
          name="data-management" 
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen 
          name="cloud-backup" 
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen 
          name="auth" 
          options={{
            animation: "fade",
          }}
        />
        {/* B2B Screens */}
        <Stack.Screen 
          name="kanban" 
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen 
          name="organization-settings" 
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen 
          name="invite" 
          options={{
            animation: "fade",
          }}
        />
      </Stack>
    </>
  );
}

// Main layout that provides all contexts
// Provider order: Theme → Auth → Subscription → Organization → Workspace → Stats → Pomodoro → Task
export default function Layout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <OrganizationProvider>
            <WorkspaceProvider>
              <StatsProvider>
                <PomodoroProvider>
                  <TaskProvider>
                    <RootLayoutNav />
                  </TaskProvider>
                </PomodoroProvider>
              </StatsProvider>
            </WorkspaceProvider>
          </OrganizationProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}