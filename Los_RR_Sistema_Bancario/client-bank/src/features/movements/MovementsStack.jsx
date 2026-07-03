// client-bank/src/features/movements/MovementsStack.jsx

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MovementsList from "./screens/MovementsList.jsx";

const Stack = createNativeStackNavigator();

const MovementsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MovementsList" component={MovementsList} />
    </Stack.Navigator>
  );
};

export default MovementsStack;
