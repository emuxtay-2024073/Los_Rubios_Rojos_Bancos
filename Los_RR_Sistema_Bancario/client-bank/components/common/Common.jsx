// client-bank/components/common/Common.jsx

import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZE } from "../../src/shared/constants/theme.js";

export const LoadingSpinner = ({ size = "large", color = COLORS.primary }) => {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

export const EmptyState = ({ icon, title, message }) => {
  return (
    <View style={styles.emptyContainer}>
      <MaterialIcons name={icon || "inbox"} size={64} color={COLORS.textLight} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
};

export const Card = ({ children, style }) => {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyMessage: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
    textAlign: "center",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});
