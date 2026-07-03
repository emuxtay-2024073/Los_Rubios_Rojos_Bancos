// client-bank/src/features/movements/screens/MovementsList.jsx

import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZE } from "../../../shared/constants/theme.js";
import { useMovements } from "../hooks/useMovements.js";
import { Card, LoadingSpinner, EmptyState } from "../../../../components/common/Common.jsx";

const FILTERS = {
  ALL: "all",
  INCOME: "income",
  EXPENSE: "expense",
};

const MovementsList = () => {
  const { movements, loading, error, refetch } = useMovements();
  const [filter, setFilter] = React.useState(FILTERS.ALL);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredMovements = React.useMemo(() => {
    if (filter === FILTERS.ALL) {
      return movements;
    }
    return movements.filter((movement) => {
      if (filter === FILTERS.INCOME) {
        return movement.type === "credit";
      }
      if (filter === FILTERS.EXPENSE) {
        return movement.type === "debit";
      }
      return true;
    });
  }, [movements, filter]);

  const sortedMovements = React.useMemo(() => {
    return [...filteredMovements].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredMovements]);

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
      <Text style={styles.title}>Mis Movimientos</Text>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === FILTERS.ALL && styles.filterActive]}
          onPress={() => setFilter(FILTERS.ALL)}
        >
          <Text style={[styles.filterText, filter === FILTERS.ALL && styles.filterTextActive]}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === FILTERS.INCOME && styles.filterActive]}
          onPress={() => setFilter(FILTERS.INCOME)}
        >
          <Text style={[styles.filterText, filter === FILTERS.INCOME && styles.filterTextActive]}>Ingresos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === FILTERS.EXPENSE && styles.filterActive]}
          onPress={() => setFilter(FILTERS.EXPENSE)}
        >
          <Text style={[styles.filterText, filter === FILTERS.EXPENSE && styles.filterTextActive]}>Egresos</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {sortedMovements.length === 0 ? (
        <EmptyState
          icon="receipt-long"
          title="Sin movimientos"
          message="No tienes movimientos registrados"
        />
      ) : (
        sortedMovements.map((movement) => (
          <Card key={movement.id} style={styles.movementCard}>
            <View style={styles.movementHeader}>
              <View style={[styles.iconContainer, movement.type === "credit" ? styles.creditIcon : styles.debitIcon]}>
                <MaterialIcons
                  name={movement.type === "credit" ? "arrow-downward" : "arrow-upward"}
                  size={20}
                  color={COLORS.surface}
                />
              </View>
              <View style={styles.movementInfo}>
                <Text style={styles.movementDescription}>{movement.description}</Text>
                <Text style={styles.movementDate}>
                  {new Date(movement.date).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
              <Text style={[
                styles.movementAmount,
                movement.type === "credit" ? styles.creditAmount : styles.debitAmount
              ]}>
                {movement.type === "credit" ? "+" : "-"} {parseFloat(movement.amount).toFixed(2)}
              </Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Saldo después:</Text>
              <Text style={styles.balanceValue}>{parseFloat(movement.balanceAfter).toFixed(2)}</Text>
            </View>
          </Card>
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
  filterContainer: {
    flexDirection: "row",
    marginBottom: SPACING.lg,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    marginHorizontal: SPACING.xs / 2,
  },
  filterActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    fontWeight: "500",
  },
  filterTextActive: {
    color: COLORS.surface,
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
  movementCard: {
    marginBottom: SPACING.md,
  },
  movementHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  creditIcon: {
    backgroundColor: COLORS.success,
  },
  debitIcon: {
    backgroundColor: COLORS.error,
  },
  movementInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  movementDescription: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    color: COLORS.text,
  },
  movementDate: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  movementAmount: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
  },
  creditAmount: {
    color: COLORS.success,
  },
  debitAmount: {
    color: COLORS.error,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  balanceLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  balanceValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.text,
  },
});

export default MovementsList;
