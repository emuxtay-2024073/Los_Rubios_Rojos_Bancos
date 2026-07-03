// client-bank/src/features/transactions/screens/TransactionsList.jsx

import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZE } from "../../../shared/constants/theme.js";
import { useTransactions } from "../hooks/useTransactions.js";
import { Card, LoadingSpinner, EmptyState } from "../../../../components/common/Common.jsx";

const TransactionsList = ({ navigation }) => {
  const { transactions, loading, error, refetch } = useTransactions();
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
      <View style={styles.header}>
        <Text style={styles.title}>Transferencias</Text>
        <TouchableOpacity
          style={styles.newTransferButton}
          onPress={() => navigation.navigate("CreateTransfer")}
        >
          <MaterialIcons name="add" size={24} color={COLORS.surface} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {transactions.length === 0 ? (
        <EmptyState
          icon="swap-horiz"
          title="Sin transferencias"
          message="No tienes transferencias registradas"
        />
      ) : (
        transactions.map((transaction) => (
          <TouchableOpacity
            key={transaction.id}
            onPress={() => navigation.navigate("TransferDetail", { transactionId: transaction.id })}
          >
            <Card style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <View style={[styles.iconContainer, transaction.type === "debit" ? styles.debitIcon : styles.creditIcon]}>
                  <MaterialIcons
                    name={transaction.type === "debit" ? "arrow-upward" : "arrow-downward"}
                    size={20}
                    color={COLORS.surface}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionType}>
                    {transaction.type === "debit" ? "Transferencia enviada" : "Transferencia recibida"}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  transaction.type === "debit" ? styles.debitAmount : styles.creditAmount
                ]}>
                  {transaction.type === "debit" ? "-" : "+"} {transaction.currency} {parseFloat(transaction.amount).toFixed(2)}
                </Text>
              </View>
              {transaction.description && (
                <Text style={styles.transactionDescription}>{transaction.description}</Text>
              )}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.primary,
  },
  newTransferButton: {
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
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
  transactionCard: {
    marginBottom: SPACING.md,
  },
  transactionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  debitIcon: {
    backgroundColor: COLORS.error,
  },
  creditIcon: {
    backgroundColor: COLORS.success,
  },
  transactionInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  transactionType: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    color: COLORS.text,
  },
  transactionDate: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  transactionAmount: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
  },
  debitAmount: {
    color: COLORS.error,
  },
  creditAmount: {
    color: COLORS.success,
  },
  transactionDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
  },
});

export default TransactionsList;
