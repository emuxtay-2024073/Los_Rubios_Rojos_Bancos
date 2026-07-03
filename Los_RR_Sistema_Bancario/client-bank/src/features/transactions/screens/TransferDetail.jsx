// client-bank/src/features/transactions/screens/TransferDetail.jsx

import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZE } from "../../../shared/constants/theme.js";
import { useTransactions } from "../hooks/useTransactions.js";
import { Card, LoadingSpinner } from "../../../../components/common/Common.jsx";

const TransferDetail = ({ route }) => {
  const { transactionId } = route.params;
  const { transactions, loading } = useTransactions();

  const transaction = transactions.find((t) => t.id === transactionId);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!transaction) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Transferencia no encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.detailCard}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, transaction.type === "debit" ? styles.debitIcon : styles.creditIcon]}>
            <MaterialIcons
              name={transaction.type === "debit" ? "arrow-upward" : "arrow-downward"}
              size={32}
              color={COLORS.surface}
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.transactionType}>
              {transaction.type === "debit" ? "Transferencia enviada" : "Transferencia recibida"}
            </Text>
            <Text style={styles.transactionId}>ID: {transaction.id}</Text>
          </View>
        </View>

        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Monto</Text>
          <Text style={[
            styles.amount,
            transaction.type === "debit" ? styles.debitAmount : styles.creditAmount
          ]}>
            {transaction.type === "debit" ? "-" : "+"} {transaction.currency} {parseFloat(transaction.amount).toFixed(2)}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha</Text>
            <Text style={styles.infoValue}>
              {new Date(transaction.createdAt).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cuenta origen</Text>
            <Text style={styles.infoValue}>{transaction.originAccountNumber}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cuenta destino</Text>
            <Text style={styles.infoValue}>{transaction.destinationAccountNumber}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estado</Text>
            <View style={[styles.statusBadge, transaction.status === "completed" ? styles.statusCompleted : styles.statusPending]}>
              <Text style={styles.statusText}>
                {transaction.status === "completed" ? "Completada" : "Pendiente"}
              </Text>
            </View>
          </View>

          {transaction.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionLabel}>Descripción</Text>
              <Text style={styles.descriptionText}>{transaction.description}</Text>
            </View>
          )}
        </View>
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
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  debitIcon: {
    backgroundColor: COLORS.error,
  },
  creditIcon: {
    backgroundColor: COLORS.success,
  },
  headerInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  transactionType: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.text,
  },
  transactionId: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  amountSection: {
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  amountLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  amount: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: "700",
  },
  debitAmount: {
    color: COLORS.error,
  },
  creditAmount: {
    color: COLORS.success,
  },
  infoSection: {
    marginBottom: SPACING.md,
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
  statusCompleted: {
    backgroundColor: COLORS.success + "20",
  },
  statusPending: {
    backgroundColor: COLORS.warning + "20",
  },
  statusText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
  },
  descriptionSection: {
    marginTop: SPACING.md,
  },
  descriptionLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  descriptionText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  errorText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.error,
    textAlign: "center",
  },
});

export default TransferDetail;
