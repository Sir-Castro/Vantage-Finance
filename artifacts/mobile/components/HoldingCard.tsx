import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Holding, usePortfolio } from "@/context/PortfolioContext";
import { CoinMarket } from "@/context/MarketContext";
import { useColors } from "@/hooks/useColors";
import { formatCurrency, formatPercent } from "@/utils/format";

interface HoldingCardProps {
  holding: Holding;
  coin?: CoinMarket;
}

export function HoldingCard({ holding, coin }: HoldingCardProps) {
  const colors = useColors();
  const { removeHolding } = usePortfolio();

  const currentPrice = coin?.current_price ?? holding.avgBuyPrice;
  const currentValue = holding.amount * currentPrice;
  const costBasis = holding.amount * holding.avgBuyPrice;
  const pnl = currentValue - costBasis;
  const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
  const isGain = pnl >= 0;

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Remove Holding", `Remove ${holding.name} from your portfolio?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeHolding(holding.id),
      },
    ]);
  };

  const styles = makeStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        {coin?.image ? (
          <Image source={{ uri: coin.image }} style={styles.icon} />
        ) : (
          <View style={[styles.icon, styles.iconPlaceholder]}>
            <Text style={styles.iconText}>{holding.symbol[0]}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{holding.name}</Text>
          <Text style={styles.amount}>
            {holding.amount.toFixed(6).replace(/\.?0+$/, "")} {holding.symbol}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.value}>{formatCurrency(currentValue)}</Text>
        <View style={styles.pnlRow}>
          <Feather
            name={isGain ? "trending-up" : "trending-down"}
            size={11}
            color={isGain ? colors.success : colors.destructive}
          />
          <Text style={[styles.pnl, { color: isGain ? colors.success : colors.destructive }]}>
            {" "}{formatCurrency(Math.abs(pnl))} ({formatPercent(Math.abs(pnlPercent))})
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} hitSlop={8}>
        <Feather name="trash-2" size={14} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    left: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    icon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      marginRight: 12,
    },
    iconPlaceholder: {
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    iconText: {
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      fontSize: 14,
    },
    info: {
      flex: 1,
    },
    name: {
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      fontSize: 14,
    },
    amount: {
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      marginTop: 2,
    },
    right: {
      alignItems: "flex-end",
      marginRight: 12,
    },
    value: {
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      fontSize: 14,
    },
    pnlRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 2,
    },
    pnl: {
      fontFamily: "Inter_500Medium",
      fontSize: 11,
    },
    deleteBtn: {
      padding: 4,
    },
  });
}
