// client-bank/src/features/transactions/screens/CreateTransfer.jsx

import React from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { COLORS, SPACING, FONT_SIZE } from "../../../shared/constants/theme.js";
import { useTransactions } from "../hooks/useTransactions.js";
import { useAccounts } from "../../accounts/hooks/useAccounts.js";
import Button from "../../../../components/common/Button.jsx";
import Input from "../../../../components/common/Input.jsx";

const CreateTransfer = ({ route, navigation }) => {
  const { originAccountId } = route.params || {};
  const { createTransfer, loading } = useTransactions();
  const { accounts } = useAccounts();

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      fromAccountId: originAccountId || "",
      toAccountId: "",
      amount: "",
      description: "",
    },
  });

  const onSubmit = async (data) => {
    const transferData = {
      fromAccountId: data.fromAccountId,
      toAccountId: data.toAccountId,
      amount: parseFloat(data.amount),
      description: data.description,
    };

    const result = await createTransfer(transferData);

    if (result.success) {
      Alert.alert(
        "Transferencia exitosa",
        "Tu transferencia ha sido realizada correctamente.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
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
        <Text style={styles.title}>Nueva Transferencia</Text>
      </View>

      <View style={styles.formContainer}>
        <Controller
          control={control}
          name="fromAccountId"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Cuenta de origen"
              placeholder="Selecciona cuenta de origen"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.fromAccountId?.message}
            />
          )}
          rules={{
            required: "La cuenta de origen es requerida",
          }}
        />

        <Controller
          control={control}
          name="toAccountId"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Cuenta destino (ID o número)"
              placeholder="Ingresa el ID o número de cuenta destino"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.toAccountId?.message}
            />
          )}
          rules={{
            required: "La cuenta destino es requerida",
          }}
        />

        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Monto"
              placeholder="0.00"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.amount?.message}
              keyboardType="decimal-pad"
            />
          )}
          rules={{
            required: "El monto es requerido",
            validate: (value) => {
              const num = parseFloat(value);
              return num > 0 || "El monto debe ser mayor a 0";
            },
          }}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Descripción (opcional)"
              placeholder="Descripción de la transferencia"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.description?.message}
            />
          )}
        />

        <Button
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={styles.button}
        >
          Realizar Transferencia
        </Button>
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
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.primary,
  },
  formContainer: {
    padding: SPACING.xl,
  },
  button: {
    marginTop: SPACING.lg,
  },
});

export default CreateTransfer;
