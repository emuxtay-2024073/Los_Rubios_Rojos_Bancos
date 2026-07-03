// client-bank/src/features/transactions/TransactionsStack.jsx

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TransactionsList from "./screens/TransactionsList.jsx";
import CreateTransfer from "./screens/CreateTransfer.jsx";
import TransferDetail from "./screens/TransferDetail.jsx";

const Stack = createNativeStackNavigator();

const TransactionsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="TransactionsList" component={TransactionsList} />
      <Stack.Screen name="CreateTransfer" component={CreateTransfer} />
      <Stack.Screen name="TransferDetail" component={TransferDetail} />
    </Stack.Navigator>
  );
};

export default TransactionsStack;
