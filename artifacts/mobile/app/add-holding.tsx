import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CoinMarket, useMarket } from "@/context/MarketContext";
import { usePortfolio } from "@/context/PortfolioContext";
import { useColors } from "@/hooks/useColors";
import { formatCurrency } from "@/utils/format";

export default function AddHoldingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { coins, isLoading } = useMarket();
  const { addHolding } = usePortfolio();

  const [search, setSearch] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<CoinMarket | null>(null);
  const [amount, setAmount] = useState("");
  const [avgBuyPrice, setAvgBuyPrice] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return coins.slice(0, 10);
    const q = search.toLowerCase();
    return coins
      .filter((c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q))
      .slice(0, 12);
  }, [coins, search]);

  const currentValue =
    selectedCoin && amount && parseFloat(amount) > 0
      ? parseFloat(amount) * selectedCoin.current_price
      : null;
  const estimatedPnl =
    selectedCoin && amount && avgBuyPrice && parseFloat(amount) > 0 && parseFloat(avgBuyPrice) > 0
      ? parseFloat(amount) * (selectedCoin.current_price - parseFloat(avgBuyPrice))
      : null;

  const canSubmit =
    selectedCoin !== null &&
    amount.trim() !== "" &&
    parseFloat(amount) > 0 &&
    avgBuyPrice.trim() !== "" &&
    parseFloat(avgBuyPrice) > 0;

  const handleSubmit = () => {
    if (!canSubmit || !selectedCoin) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addHolding({
      coinId: selectedCoin.id,
      symbol: selectedCoin.symbol.toUpperCase(),
      name: selectedCoin.name,
      amount: parseFloat(amount),
      avgBuyPrice: parseFloat(avgBuyPrice),
    });
    router.back();
  };

  const styles = makeStyles(colors);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.navBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Add Holding</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={[styles.saveBtn, !canSubmit && styles.saveBtnDisabled]}
        >
          <Text style={[styles.saveBtnText, !canSubmit && styles.saveBtnTextDisabled]}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!selectedCoin ? (
          <>
            <Text style={styles.sectionLabel}>Select Coin</Text>
            <View style={styles.searchBar}>
              <Feather name="search" size={15} color={colors.mutedForeground} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search cryptocurrency..."
                placeholderTextColor={colors.mutedForeground}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                autoCapitalize="none"
                autoFocus
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Feather name="x" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            {isLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              filtered.map((coin) => (
                <TouchableOpacity
                  key={coin.id}
                  style={styles.coinRow}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedCoin(coin);
                    setAvgBuyPrice(coin.current_price.toFixed(2));
                    setSearch("");
                  }}
                >
                  <Image source={{ uri: coin.image }} style={styles.coinIcon} />
                  <View style={styles.coinInfo}>
                    <Text style={styles.coinName}>{coin.name}</Text>
                    <Text style={styles.coinSymbol}>{coin.symbol.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.coinPrice}>{formatCurrency(coin.current_price)}</Text>
                </TouchableOpacity>
              ))
            )}
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.selectedCoin}
              onPress={() => setSelectedCoin(null)}
            >
              <Image source={{ uri: selectedCoin.image }} style={styles.selectedIcon} />
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedName}>{selectedCoin.name}</Text>
                <Text style={styles.selectedPrice}>
                  Current: {formatCurrency(selectedCoin.current_price)}
                </Text>
              </View>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>Amount</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder={`0.00 ${selectedCoin.symbol.toUpperCase()}`}
                placeholderTextColor={colors.mutedForeground}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
              <Text style={styles.inputUnit}>{selectedCoin.symbol.toUpperCase()}</Text>
            </View>

            <Text style={styles.sectionLabel}>Average Buy Price (USD)</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputPrefix}>$</Text>
              <TextInput
                style={[styles.input, { paddingLeft: 4 }]}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                value={avgBuyPrice}
                onChangeText={setAvgBuyPrice}
                keyboardType="decimal-pad"
              />
            </View>

            {currentValue !== null && (
              <View style={styles.previewCard}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Current Value</Text>
                  <Text style={styles.previewValue}>{formatCurrency(currentValue)}</Text>
                </View>
                {estimatedPnl !== null && (
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Unrealized P&L</Text>
                    <Text
                      style={[
                        styles.previewValue,
                        { color: estimatedPnl >= 0 ? colors.success : colors.destructive },
                      ]}
                    >
                      {estimatedPnl >= 0 ? "+" : ""}{formatCurrency(estimatedPnl)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              <Feather name="plus-circle" size={17} color={canSubmit ? colors.primaryForeground : colors.mutedForeground} />
              <Text style={[styles.submitBtnText, !canSubmit && styles.submitBtnTextDisabled]}>
                Add to Portfolio
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    navBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: { padding: 4 },
    navTitle: {
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      fontSize: 16,
    },
    saveBtn: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: colors.primary, borderRadius: 16 },
    saveBtnDisabled: { backgroundColor: colors.muted },
    saveBtnText: { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold", fontSize: 13 },
    saveBtnTextDisabled: { color: colors.mutedForeground },
    sectionLabel: {
      color: colors.mutedForeground,
      fontFamily: "Inter_500Medium",
      fontSize: 11,
      letterSpacing: 0.5,
      textTransform: "uppercase",
      marginTop: 20,
      marginBottom: 8,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      paddingHorizontal: 12,
      paddingVertical: 12,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      fontSize: 15,
    },
    loadingWrap: { padding: 32, alignItems: "center" },
    coinRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    coinIcon: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
    coinInfo: { flex: 1 },
    coinName: { color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 14 },
    coinSymbol: { color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
    coinPrice: { color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 13 },
    selectedCoin: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.primary,
      marginTop: 12,
    },
    selectedIcon: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    selectedInfo: { flex: 1 },
    selectedName: { color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 15 },
    selectedPrice: { color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 3 },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      flex: 1,
      color: colors.foreground,
      fontFamily: "Inter_500Medium",
      fontSize: 16,
    },
    inputUnit: {
      color: colors.mutedForeground,
      fontFamily: "Inter_500Medium",
      fontSize: 13,
    },
    inputPrefix: {
      color: colors.mutedForeground,
      fontFamily: "Inter_500Medium",
      fontSize: 16,
      marginRight: 4,
    },
    previewCard: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 14,
      marginTop: 20,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    previewRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    previewLabel: {
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 13,
    },
    previewValue: {
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      fontSize: 15,
    },
    submitBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 24,
      paddingVertical: 15,
      marginTop: 28,
    },
    submitBtnDisabled: { backgroundColor: colors.muted },
    submitBtnText: {
      color: colors.primaryForeground,
      fontFamily: "Inter_700Bold",
      fontSize: 16,
    },
    submitBtnTextDisabled: { color: colors.mutedForeground },
  });
}
