import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import HomeScreen from "../screens/HomeScreen";
import AddTask from "../screens/AddTask";

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Mis Tareas" }}
        />
        <Stack.Screen
          name="AddTask"
          component={AddTask}
          options={{ title: "Nueva Tarea" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
