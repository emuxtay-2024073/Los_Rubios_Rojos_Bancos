// client-bank/src/navigation/AppNavigator.jsx

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AuthStack from "./AuthStack.jsx";
import MainTabs from "./MainTabs.jsx";
import { LoadingSpinner } from "../../components/common/Common.jsx";
import useAuthStore from "../../store/authStore.js";
import VerifyEmailScreen from "../features/auth/screens/VerifyEmailScreen.jsx";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ["losrubiosrojos://"],
  config: {
    screens: {
      VerifyEmail: {
        path: "verify-email",
        parse: {
          token: (token) => token,
        },
      },
    },
  },
};

const AppNavigator = () => {
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  console.log("AppNavigator - isAuthenticated:", isAuthenticated, "_hasHydrated:", _hasHydrated);

  if (!_hasHydrated) {
    console.log("Showing LoadingSpinner...");
    return <LoadingSpinner />;
  }

  console.log("Showing navigation:", isAuthenticated ? "MainTabs" : "AuthStack");
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={isAuthenticated ? "MainTabs" : "AuthStack"}
      >
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        {isAuthenticated ? (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        ) : (
          <Stack.Screen name="AuthStack" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
