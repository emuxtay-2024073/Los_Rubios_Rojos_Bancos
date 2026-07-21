// client-bank/src/features/auth/screens/RegisterScreen.jsx

import React from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { COLORS, SPACING, FONT_SIZE } from "../../../shared/constants/theme.js";
import Button from "../../../../components/common/Button.jsx";
import Input from "../../../../components/common/Input.jsx";
import { useAuth } from "../hooks/useAuth.js";

const RegisterScreen = ({ navigation }) => {
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      username: "",
      email: "",
      phoneNumber: "",
      dpi: "",
      password: "",
      accountType: "ahorro",
    },
    mode: "onSubmit",
  });

  const { handleRegister, loading } = useAuth();

  const onSubmit = async (data) => {
    console.log("Register data:", data);
    const result = await handleRegister(data);
    console.log("Register result:", result);
    if (result.success) {
      Alert.alert(
        "Registro exitoso",
        result.data?.message || "Tu cuenta ha sido creada. Revisa tu correo para verificarla antes de iniciar sesión.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login"),
          },
        ]
      );
    } else {
      Alert.alert("Error", result.error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Crear Cuenta</Text>
        <Text style={styles.subtitle}>Regístrate para comenzar</Text>
      </View>

      <View style={styles.formContainer}>
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Nombre de usuario"
              placeholder="Ingresa tu nombre de usuario"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.username?.message}
            />
          )}
          rules={{
            required: "El nombre de usuario es requerido",
            minLength: {
              value: 3,
              message: "Mínimo 3 caracteres",
            },
          }}
        />

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
          name="phoneNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Teléfono (opcional)"
              placeholder="+502 7000 0000"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.phoneNumber?.message}
              keyboardType="phone-pad"
            />
          )}
          rules={{
            pattern: {
              value: /^[+]?([0-9]{1,3})?[\s.-]?[(]?[0-9]{3}[)]?[\s.-]?[0-9]{3,4}[\s.-]?[0-9]{4}$/,
              message: "Teléfono inválido",
            },
          }}
        />

        <Controller
          control={control}
          name="dpi"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="DPI (opcional)"
              placeholder="1234567890101"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.dpi?.message}
              keyboardType="numeric"
            />
          )}
          rules={{
            pattern: {
              value: /^[0-9]{13,15}$/,
              message: "DPI inválido (13-15 dígitos)",
            },
          }}
        />

        <Controller
          control={control}
          name="accountType"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tipo de cuenta</Text>
              <View style={styles.pickerContainer}>
                <Text 
                  style={[styles.pickerOption, value === 'ahorro' && styles.pickerOptionSelected]}
                  onPress={() => onChange('ahorro')}
                >
                  {value === 'ahorro' ? '✓ ' : ''}Ahorro
                </Text>
                <Text 
                  style={[styles.pickerOption, value === 'monetaria' && styles.pickerOptionSelected]}
                  onPress={() => onChange('monetaria')}
                >
                  {value === 'monetaria' ? '✓ ' : ''}Monetaria
                </Text>
                <Text 
                  style={[styles.pickerOption, value === 'corriente' && styles.pickerOptionSelected]}
                  onPress={() => onChange('corriente')}
                >
                  {value === 'corriente' ? '✓ ' : ''}Corriente
                </Text>
              </View>
            </View>
          )}
          rules={{
            required: "El tipo de cuenta es requerido",
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
          Registrarse
        </Button>

        <Text style={styles.loginText}>
          ¿Ya tienes cuenta?{" "}
          <Text 
            style={styles.loginTextBold} 
            onPress={() => navigation.navigate("Login")}
          >
            Inicia Sesión
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.xl,
    paddingTop: SPACING.xxl,
    alignItems: "center",
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
    padding: SPACING.xl,
  },
  button: {
    marginTop: SPACING.lg,
  },
  loginText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    textAlign: "center",
    marginTop: SPACING.lg,
  },
  loginTextBold: {
    fontWeight: "600",
    color: COLORS.primary,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  pickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
  },
  pickerOption: {
    flex: 1,
    textAlign: "center",
    padding: SPACING.sm,
    color: COLORS.textLight,
    fontSize: FONT_SIZE.sm,
  },
  pickerOptionSelected: {
    color: COLORS.primary,
    fontWeight: "700",
    backgroundColor: COLORS.background,
    borderRadius: 6,
  },
});

export default RegisterScreen;
