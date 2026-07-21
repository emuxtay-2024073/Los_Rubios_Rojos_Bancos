// client-bank/src/features/auth/screens/LoginScreen.jsx

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { COLORS, SPACING, FONT_SIZE } from "../../../shared/constants/theme.js";
import Button from "../../../../components/common/Button.jsx";
import Input from "../../../../components/common/Input.jsx";
import { useAuth } from "../hooks/useAuth.js";

const LoginScreen = ({ navigation }) => {
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const { handleLogin, loading } = useAuth();

  const onSubmit = async (data) => {
    const result = await handleLogin(data.email, data.password);
    if (result.success) {
      // Navegar manualmente a MainTabs después del login exitoso
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    } else {
      Alert.alert("Error", result.error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <MaterialIcons name="account-balance" size={80} color={COLORS.primary} />
        <Text style={styles.title}>Banco Los Rubios Rojos</Text>
        <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>
      </View>

      <View style={styles.formContainer}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Correo electrónico"
              placeholder="ejemplo@correo.com"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
          rules={{
            required: "El correo es requerido",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Correo inválido",
            },
          }}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Contraseña"
              placeholder="Ingresa tu contraseña"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              secureTextEntry
            />
          )}
          rules={{
            required: "La contraseña es requerida",
            minLength: {
              value: 6,
              message: "Mínimo 6 caracteres",
            },
          }}
        />

        <Button
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={styles.button}
        >
          Iniciar Sesión
        </Button>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.registerText}>
            ¿No tienes cuenta? <Text style={styles.registerTextBold}>Regístrate</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
  },
  formContainer: {
    flex: 1,
  },
  button: {
    marginTop: SPACING.lg,
  },
  registerLink: {
    alignItems: "center",
    marginTop: SPACING.lg,
  },
  registerText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  registerTextBold: {
    fontWeight: "600",
    color: COLORS.primary,
  },
});

export default LoginScreen;
