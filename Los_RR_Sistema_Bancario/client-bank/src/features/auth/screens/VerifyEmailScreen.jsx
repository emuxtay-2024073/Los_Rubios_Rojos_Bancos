// client-bank/src/features/auth/screens/VerifyEmailScreen.jsx

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { COLORS, SPACING, FONT_SIZE } from "../../../shared/constants/theme.js";
import authClient from "../../../../api/authClient.js";

const VerifyEmailScreen = ({ route, navigation }) => {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  
  const token = route.params?.token;

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Token inválido.");
        return;
      }

      try {
        const response = await authClient.get(`/verify-email?token=${encodeURIComponent(token)}`);
        
        if (response.status === 200) {
          setStatus("success");
          setMessage("¡Correo verificado correctamente! Ya puedes iniciar sesión.");
        } else {
          setStatus("error");
          setMessage("El enlace ha expirado o no es válido.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("El enlace ha expirado o no es válido.");
      }
    };

    verifyEmail();
  }, [token]);

  const handleGoToLogin = () => {
    navigation.navigate("Login");
  };

  const renderIcon = () => {
    if (status === "success") {
      return (
        <View style={[styles.iconContainer, styles.successIcon]}>
          <Text style={styles.iconText}>✅</Text>
        </View>
      );
    }

    if (status === "loading") {
      return (
        <View style={[styles.iconContainer, styles.loadingIcon]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    return (
      <View style={[styles.iconContainer, styles.errorIcon]}>
        <Text style={styles.iconText}>❌</Text>
      </View>
    );
  };

  const renderTitle = () => {
    if (status === "success") return "¡Cuenta verificada con éxito!";
    if (status === "loading") return "Verificando tu cuenta...";
    return "No se pudo verificar tu cuenta";
  };

  const renderSubtitle = () => {
    if (status === "success") 
      return "Gracias por confirmar tu email. Ya puedes iniciar sesión y comenzar a gestionar tu banca.";
    if (status === "loading") 
      return "Estamos confirmando el enlace enviado a tu correo. Un momento, por favor.";
    return message || "El enlace de verificación es inválido o ha expirado. Comprueba el correo de confirmación e intenta de nuevo.";
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderIcon()}
        <Text style={styles.title}>{renderTitle()}</Text>
        <Text style={styles.subtitle}>{renderSubtitle()}</Text>

        {status !== "loading" && (
          <TouchableOpacity style={styles.button} onPress={handleGoToLogin}>
            <Text style={styles.buttonText}>Ir al inicio de sesión</Text>
          </TouchableOpacity>
        )}

        {status === "success" && (
          <Text style={styles.autoRedirectText}>
            Serás redirigido automáticamente en unos segundos...
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  content: {
    alignItems: "center",
    maxWidth: 400,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  successIcon: {
    backgroundColor: "rgba(10, 36, 114, 0.1)",
  },
  loadingIcon: {
    backgroundColor: "rgba(251, 191, 36, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(10, 36, 114, 0.12)",
  },
  errorIcon: {
    backgroundColor: "rgba(201, 160, 99, 0.18)",
  },
  iconText: {
    fontSize: 50,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
    textAlign: "center",
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 50,
    marginBottom: SPACING.md,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
  },
  autoRedirectText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    textAlign: "center",
  },
});

export default VerifyEmailScreen;
