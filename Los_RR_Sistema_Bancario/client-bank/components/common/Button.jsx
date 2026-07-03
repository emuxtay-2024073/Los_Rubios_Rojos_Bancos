// client-bank/components/common/Button.jsx

import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS, SPACING, FONT_SIZE } from "../../src/shared/constants/theme.js";

const Button = ({ 
  children, 
  onPress, 
  variant = "primary", 
  loading = false, 
  disabled = false,
  style 
}) => {
  const buttonStyle = [
    styles.button,
    variant === "primary" ? styles.primary : styles.secondary,
    disabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    variant === "primary" ? styles.textPrimary : styles.textSecondary,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? COLORS.surface : COLORS.primary} />
      ) : (
        <Text style={textStyle}>{children}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
  },
  textPrimary: {
    color: COLORS.surface,
  },
  textSecondary: {
    color: COLORS.primary,
  },
});

export default Button;
