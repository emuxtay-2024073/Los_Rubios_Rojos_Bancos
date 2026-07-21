// client-bank/src/features/cards/hooks/useCards.js

import { useState, useCallback, useEffect } from "react";
import userClient from "../../../../api/userClient.js";
import useAuthStore from "../../../../store/authStore.js";

export const useCards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = useAuthStore.getState().token;
      if (!token) {
        setError("No hay token de autenticación");
        return;
      }
      console.log("Fetching cards from:", "/cards/my-cards");
      const response = await userClient.get("/cards/my-cards");
      console.log("Cards response:", response.data);
      const data = response.data.data || response.data;
      const mappedCards = data.map((card) => ({
        id: card.id,
        cardNumber: card.cardNumber,
        brand: card.brand,
        type: card.type,
        expirationDate: card.expirationDate,
        status: card.status,
      }));
      setCards(mappedCards);
    } catch (err) {
      console.error("Error fetching cards:", err);
      const errorMessage = err.response?.data?.message || err.message || "Error al cargar tarjetas";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const blockCard = useCallback(async (cardId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userClient.put(`/cards/${cardId}/block`);
      await fetchCards();
      return { success: true, data: response.data.data || response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Error al bloquear tarjeta";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchCards]);

  const unblockCard = useCallback(async (cardId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userClient.put(`/cards/${cardId}/unblock`);
      await fetchCards();
      return { success: true, data: response.data.data || response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Error al desbloquear tarjeta";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchCards]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  return {
    cards,
    loading,
    error,
    refetch: fetchCards,
    blockCard,
    unblockCard,
  };
};
