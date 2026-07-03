// client-bank/src/features/cards/CardsStack.jsx

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CardsList from "./screens/CardsList.jsx";
import CardDetail from "./screens/CardDetail.jsx";

const Stack = createNativeStackNavigator();

const CardsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CardsList" component={CardsList} />
      <Stack.Screen name="CardDetail" component={CardDetail} />
    </Stack.Navigator>
  );
};

export default CardsStack;
