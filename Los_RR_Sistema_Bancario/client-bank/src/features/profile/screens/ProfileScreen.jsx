// client-bank/src/features/profile/screens/ProfileScreen.jsx

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Image, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { COLORS, SPACING, FONT_SIZE } from "../../../shared/constants/theme.js";
import { useProfile } from "../hooks/useProfile.js";
import useAuthStore from "../../../../store/authStore.js";
import { Card, LoadingSpinner } from "../../../../components/common/Common.jsx";
import Button from "../../../../components/common/Button.jsx";
import Input from "../../../../components/common/Input.jsx";

const ProfileScreen = () => {
  const { profile, loading, updateProfile } = useProfile();
  const { logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      username: "",
      email: "",
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        username: profile.username || "",
        email: profile.email || "",
      });
    }
  }, [profile, reset]);

  const handleUpdate = async (data) => {
    const result = await updateProfile(data);
    if (result.success) {
      Alert.alert("Éxito", "Perfil actualizado correctamente");
      setIsEditing(false);
    } else {
      Alert.alert("Error", result.error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que deseas cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  if (loading && !profile) {
    return <LoadingSpinner />;
  }

  const avatarSource = profile?.avatar?.startsWith("http")
    ? { uri: profile.avatar }
    : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {avatarSource ? (
          <Image source={avatarSource} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <MaterialIcons name="person" size={48} color={COLORS.primary} />
          </View>
        )}
        <Text style={styles.userName}>
          {profile?.username}
        </Text>
        <Text style={styles.userEmail}>{profile?.email}</Text>
      </View>

      <Card style={styles.formCard}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Información personal</Text>
          <Button
            onPress={() => setIsEditing(!isEditing)}
            variant="secondary"
            style={styles.editButton}
          >
            {isEditing ? "Cancelar" : "Editar perfil"}
          </Button>
        </View>

        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Nombre de usuario"
              placeholder="Tu nombre de usuario"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.username?.message}
              editable={isEditing}
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
              placeholder="Tu correo electrónico"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={isEditing}
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

        {isEditing && (
          <Button
            onPress={handleSubmit(handleUpdate)}
            loading={loading}
            style={styles.saveButton}
          >
            Guardar cambios
          </Button>
        )}
      </Card>

      <Card style={styles.logoutCard}>
        <Button
          onPress={handleLogout}
          variant="secondary"
          style={styles.logoutButton}
        >
          Cerrar sesión
        </Button>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: "center",
    padding: SPACING.xl,
    paddingTop: SPACING.xxl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: SPACING.md,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  userName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  userEmail: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
  },
  formCard: {
    margin: SPACING.md,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  formTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.text,
  },
  editButton: {
    paddingHorizontal: SPACING.md,
  },
  saveButton: {
    marginTop: SPACING.lg,
  },
  logoutCard: {
    margin: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
  },
});

export default ProfileScreen;
