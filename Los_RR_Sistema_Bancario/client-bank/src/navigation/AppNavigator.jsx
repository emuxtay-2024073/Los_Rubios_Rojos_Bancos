// client-bank/src/navigation/AppNavigator.jsx

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AuthStack from "./AuthStack.jsx";
import MainTabs from "./MainTabs.jsx";
import { LoadingSpinner } from "../../components/common/Common.jsx";
import useAuthStore from "../../store/authStore.js";

const AppNavigator = () => {
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  console.log("AppNavigator - isAuthenticated:", isAuthenticated, "_hasHydrated:", _hasHydrated);

  if (!_hasHydrated) {
    console.log("Showing LoadingSpinner...");
    return <LoadingSpinner />;
  }

  console.log("Showing navigation:", isAuthenticated ? "MainTabs" : "AuthStack");
  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
