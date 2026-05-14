import React, { memo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { CoinMarket } from "@/context/MarketContext";
import { useColors } from "@/hooks/useColors";
import { formatCurrency, formatLargeNumber, formatPercent } from "@/utils/format";

interface MarketRowProps {
  coin: CoinMarket;
  rank?: number;
}

function SparklineMini({ prices, isPositive }: { prices: number[]; isPositive: boolean }) {
  const colors = useColors();
  const reduced = prices.filter((_, i) => i % Math.ceil(prices.length / 20) === 0).slice(-20);
  if (reduced.length < 2) return <View style={{ width: 60 }} />;
  const min = Math.min(...reduced);
  const max = Math.max(...reduced);
  const range = max - min || 1;
  const W = 60;
  const H = 28;
  const step = W / (reduced.length - 1);

  const points = reduced.map((p, i) => {
    const x = i * step;
    const y = H - ((p - min) / range) * H;
    return `${x},${y}`;
  });

  return (
    <View style={{ width: W, height: H }}>
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={isPositive ? colors.success : colors.destructive}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </View>
  );
}

function SparklineNative({ prices, isPositive }: { prices: number[]; isPositive: boolean }) {
  return null;
}

export const MarketRow = memo(function MarketRow({ coin }: MarketRowProps) {
  const colors = useColors();
  const isPositive = coin.price_change_percentage_24h >= 0;
  const styles = makeStyles(colors);

  return (
    <View style={styles.row}>
      <View style={styles.coinInfo}>
        <Image source={{ uri: coin.image }} style={styles.icon} />
        <View>
          <Text style={styles.name}>{coin.name}</Text>
          <Text style={styles.symbol}>{coin.symbol.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.priceInfo}>
        <Text style={styles.price}>{formatCurrency(coin.current_price)}</Text>
        <Text style={[styles.change, { color: isPositive ? colors.success : colors.destructive }]}>
          {isPositive ? "+" : ""}{formatPercent(coin.price_change_percentage_24h)}
        </Text>
      </View>
    </View>
  );
});

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    coinInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 12,
    },
    name: {
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      fontSize: 14,
    },
    symbol: {
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      marginTop: 1,
    },
    priceInfo: {
      alignItems: "flex-end",
    },
    price: {
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      fontSize: 14,
    },
    change: {
      fontFamily: "Inter_500Medium",
      fontSize: 12,
      marginTop: 2,
    },
  });
}
