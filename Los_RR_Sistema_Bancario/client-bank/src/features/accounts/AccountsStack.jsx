// client-bank/src/features/accounts/AccountsStack.jsx

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AccountsList from "./screens/AccountsList.jsx";
import AccountDetail from "./screens/AccountDetail.jsx";

const Stack = createNativeStackNavigator();

const AccountsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AccountsList" component={AccountsList} />
      <Stack.Screen name="AccountDetail" component={AccountDetail} />
    </Stack.Navigator>
  );
};

export default AccountsStack;
