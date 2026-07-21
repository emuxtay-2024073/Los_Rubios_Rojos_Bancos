// client-bank/src/features/cards/screens/CardsList.jsx

import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZE } from "../../../shared/constants/theme.js";
import { useCards } from "../hooks/useCards.js";
import { Card, LoadingSpinner, EmptyState } from "../../../../components/common/Common.jsx";

const CardsList = ({ navigation }) => {
  const { cards, loading, error, refetch } = useCards();
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
      <Text style={styles.title}>Mis Tarjetas</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {cards.length === 0 ? (
        <EmptyState
          icon="credit-card"
          title="Sin tarjetas"
          message="No tienes tarjetas registradas"
        />
      ) : (
        cards.map((card) => (
          <TouchableOpacity
            key={card.id}
            onPress={() => navigation.navigate("CardDetail", { cardId: card.id })}
          >
            <Card style={styles.cardCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="credit-card" size={32} color={COLORS.primary} />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardBrand}>{card.brand}</Text>
                  <Text style={styles.cardType}>{card.type}</Text>
                </View>
                <View style={[styles.statusBadge, card.status === "active" ? styles.statusActive : styles.statusBlocked]}>
                  <Text style={styles.statusText}>{card.status === "active" ? "Activa" : "Bloqueada"}</Text>
                </View>
              </View>
              <View style={styles.cardNumber}>
                <Text style={styles.cardNumberText}>**** **** **** {card.cardNumber && card.cardNumber.length >= 4 ? card.cardNumber.slice(-4) : '****'}</Text>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.expirationLabel}>Expira:</Text>
                <Text style={styles.expirationText}>{card.expirationDate}</Text>
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
  cardCard: {
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  cardInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  cardBrand: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "600",
    color: COLORS.text,
  },
  cardType: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: COLORS.success + "20",
  },
  statusBlocked: {
    backgroundColor: COLORS.error + "20",
  },
  statusText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "600",
  },
  cardNumber: {
    marginBottom: SPACING.md,
  },
  cardNumberText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: 2,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  expirationLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  expirationText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: SPACING.xs,
  },
});

export default CardsList;
