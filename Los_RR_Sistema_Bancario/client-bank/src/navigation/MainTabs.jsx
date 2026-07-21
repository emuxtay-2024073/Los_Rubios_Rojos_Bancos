// client-bank/src/navigation/MainTabs.jsx

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../shared/constants/theme.js";
import AccountsStack from "../features/accounts/AccountsStack.jsx";
import TransactionsStack from "../features/transactions/TransactionsStack.jsx";
import MovementsStack from "../features/movements/MovementsStack.jsx";
import ProfileScreen from "../features/profile/screens/ProfileScreen.jsx";
// CardsStack deshabilitado temporalmente - pendiente implementación de backend
// import CardsStack from "../features/cards/CardsStack.jsx";

const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Cuentas") {
            iconName = "account-balance";
          } else if (route.name === "Transferencias") {
            iconName = "swap-horiz";
          } else if (route.name === "Movimientos") {
            iconName = "receipt-long";
          } else if (route.name === "Perfil") {
            iconName = "person";
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.secondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          height: 60,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Cuentas" component={AccountsStack} />
      <Tab.Screen name="Transferencias" component={TransactionsStack} />
      <Tab.Screen name="Movimientos" component={MovementsStack} />
      {/* CardsStack deshabilitado temporalmente - pendiente implementación de backend */}
      {/* <Tab.Screen name="Tarjetas" component={CardsStack} /> */}
      <Tab.Screen 
        name="Perfil" 
        component={ProfileScreen}
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.surface,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;
