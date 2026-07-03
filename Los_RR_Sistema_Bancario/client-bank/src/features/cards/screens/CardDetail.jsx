// client-bank/src/features/cards/screens/CardDetail.jsx

import React from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZE } from "../../../shared/constants/theme.js";
import { useCards } from "../hooks/useCards.js";
import { Card, LoadingSpinner } from "../../../../components/common/Common.jsx";
import Button from "../../../../components/common/Button.jsx";

const CardDetail = ({ route }) => {
  const { cardId } = route.params;
  const { cards, loading, blockCard, unblockCard } = useCards();

  const card = cards.find((c) => c.id === cardId);

  const handleBlock = async () => {
    Alert.alert(
      "Bloquear tarjeta",
      "¿Estás seguro de que deseas bloquear esta tarjeta?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Bloquear",
          style: "destructive",
          onPress: async () => {
            const result = await blockCard(cardId);
            if (result.success) {
              Alert.alert("Éxito", "Tarjeta bloqueada correctamente");
            } else {
              Alert.alert("Error", result.error);
            }
          },
        },
      ]
    );
  };

  const handleUnblock = async () => {
    Alert.alert(
      "Desbloquear tarjeta",
      "¿Estás seguro de que deseas desbloquear esta tarjeta?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Desbloquear",
          onPress: async () => {
            const result = await unblockCard(cardId);
            if (result.success) {
              Alert.alert("Éxito", "Tarjeta desbloqueada correctamente");
            } else {
              Alert.alert("Error", result.error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!card) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Tarjeta no encontrada</Text>
      </View>
    );
  }

  const maskedNumber = `**** **** **** ${card.cardNumber.slice(-4)}`;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.detailCard}>
        <View style={styles.header}>
          <MaterialIcons name="credit-card" size={48} color={COLORS.primary} />
          <View style={styles.headerInfo}>
            <Text style={styles.cardBrand}>{card.brand}</Text>
            <Text style={styles.cardType}>{card.type}</Text>
          </View>
        </View>

        <View style={styles.cardNumberSection}>
          <Text style={styles.cardNumber}>{maskedNumber}</Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de expiración</Text>
            <Text style={styles.infoValue}>{card.expirationDate}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estado</Text>
            <View style={[styles.statusBadge, card.status === "active" ? styles.statusActive : styles.statusBlocked]}>
              <Text style={styles.statusText}>{card.status === "active" ? "Activa" : "Bloqueada"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsSection}>
          {card.status === "active" ? (
            <Button
              onPress={handleBlock}
              variant="secondary"
              style={styles.actionButton}
            >
              Bloquear tarjeta
            </Button>
          ) : (
            <Button
              onPress={handleUnblock}
              style={styles.actionButton}
            >
              Desbloquear tarjeta
            </Button>
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
  headerInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  cardBrand: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    color: COLORS.text,
  },
  cardType: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
  },
  cardNumberSection: {
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardNumber: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: 3,
    textAlign: "center",
  },
  infoSection: {
    marginBottom: SPACING.xl,
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
  statusBlocked: {
    backgroundColor: COLORS.error + "20",
  },
  statusText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
  },
  actionsSection: {
    marginTop: SPACING.lg,
  },
  actionButton: {
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.error,
    textAlign: "center",
  },
});

export default CardDetail;
