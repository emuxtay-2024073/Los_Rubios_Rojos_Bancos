// client-bank/src/features/accounts/screens/AccountDetail.jsx

import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZE } from "../../../shared/constants/theme.js";
import { useAccounts } from "../hooks/useAccounts.js";
import { Card, LoadingSpinner } from "../../../../components/common/Common.jsx";
import Button from "../../../../components/common/Button.jsx";

const AccountDetail = ({ route, navigation }) => {
  const { accountId } = route.params;
  const { accounts, loading } = useAccounts();

  const account = accounts.find((acc) => acc.id === accountId);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!account) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Cuenta no encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.detailCard}>
        <View style={styles.header}>
          <MaterialIcons name="account-balance" size={48} color={COLORS.primary} />
          <View style={styles.headerInfo}>
            <Text style={styles.accountType}>{account.accountType}</Text>
            <Text style={styles.accountNumber}>{account.accountNumber}</Text>
          </View>
        </View>

        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Saldo disponible</Text>
          <Text style={styles.balanceAmount}>
            {account.currency} {parseFloat(account.balance).toFixed(2)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Estado</Text>
          <View style={[styles.statusBadge, account.status === "active" ? styles.statusActive : styles.statusInactive]}>
            <Text style={styles.statusText}>{account.status === "active" ? "Activa" : "Inactiva"}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Moneda</Text>
          <Text style={styles.infoValue}>{account.currency}</Text>
        </View>

        <Button
          onPress={() => navigation.navigate("CreateTransfer", { originAccountId: account.id })}
          style={styles.transferButton}
        >
          Realizar transferencia
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
  detailCard: {
    margin: SPACING.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  headerInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  accountType: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    color: COLORS.text,
  },
  accountNumber: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
  },
  balanceSection: {
    marginBottom: SPACING.xl,
  },
  balanceLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  balanceAmount: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: "700",
    color: COLORS.primary,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  infoLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
  },
  infoValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: COLORS.success + "20",
  },
  statusInactive: {
    backgroundColor: COLORS.secondary + "20",
  },
  statusText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
  },
  transferButton: {
    marginTop: SPACING.lg,
  },
  errorText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.error,
    textAlign: "center",
  },
});

export default AccountDetail;
