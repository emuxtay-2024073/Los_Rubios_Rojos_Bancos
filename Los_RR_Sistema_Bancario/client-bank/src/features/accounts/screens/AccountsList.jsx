// client-bank/src/features/accounts/screens/AccountsList.jsx

import React from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme.js";
import { useAccounts } from "../hooks/useAccounts.js";
import { Card, LoadingSpinner, EmptyState } from "../../../../components/common/Common.jsx";

const AccountsList = ({ navigation }) => {
  const { accounts, loading, error, refetch } = useAccounts();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Mis Cuentas</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {accounts.length === 0 ? (
        <EmptyState
          icon="account-balance"
          title="Sin cuentas"
          message="No tienes cuentas registradas"
        />
      ) : (
        accounts.map((account) => (
          <TouchableOpacity
            key={account.id}
            onPress={() => navigation.navigate("AccountDetail", { accountId: account.id })}
          >
            <Card style={styles.accountCard}>
              <View style={styles.accountHeader}>
                <MaterialIcons name="account-balance" size={32} color={COLORS.primary} />
                <View style={styles.accountInfo}>
                  <Text style={styles.accountType}>{account.accountType}</Text>
                  <Text style={styles.accountNumber}>**** {account.accountNumber.slice(-4)}</Text>
                </View>
              </View>
              <View style={styles.accountBalance}>
                <Text style={styles.balanceLabel}>Saldo disponible</Text>
                <Text style={styles.balanceAmount}>
                  {account.currency} {parseFloat(account.balance).toFixed(2)}
                </Text>
              </View>
              <View style={styles.accountStatus}>
                <View style={[styles.statusBadge, account.status === "active" ? styles.statusActive : styles.statusInactive]}>
                  <Text style={styles.statusText}>{account.status === "active" ? "Activa" : "Inactiva"}</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  errorContainer: {
    backgroundColor: COLORS.error + "10",
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.sm,
  },
  accountCard: {
    marginBottom: SPACING.md,
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  accountInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  accountType: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "600",
    color: COLORS.text,
  },
  accountNumber: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  accountBalance: {
    marginBottom: SPACING.md,
  },
  balanceLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  balanceAmount: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.primary,
  },
  accountStatus: {
    alignItems: "flex-start",
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
    fontSize: FONT_SIZE.xs,
    fontWeight: "600",
  },
});

export default AccountsList;
