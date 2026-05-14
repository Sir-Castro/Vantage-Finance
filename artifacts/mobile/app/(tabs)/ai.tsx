import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useMarket } from "@/context/MarketContext";
import { useColors } from "@/hooks/useColors";
import { formatCurrency, formatPercent, formatLargeNumber } from "@/utils/format";

interface AISummary {
  text: string;
  generatedAt: number;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  keyPoints: string[];
}

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;

async function fetchAISummary(marketData: {
  coins: Array<{
    name: string;
    symbol: string;
    price: number;
    change24h: number;
    marketCap: number;
    volume: number;
  }>;
  globalData: {
    totalMarketCap: number;
    btcDominance: number;
    marketCapChange24h: number;
  } | null;
}): Promise<AISummary> {
  if (!DOMAIN) throw new Error("No domain configured");

  const response = await fetch(`https://${DOMAIN}/api/ai/market-summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ marketData }),
  });

  if (!response.ok) throw new Error("AI service unavailable");
  return response.json();
}

function SentimentBadge({ sentiment }: { sentiment: AISummary["sentiment"] }) {
  const colors = useColors();
  const config = {
    bullish: { color: colors.success, label: "Bullish", icon: "trending-up" },
    bearish: { color: colors.destructive, label: "Bearish", icon: "trending-down" },
    neutral: { color: colors.mutedForeground, label: "Neutral", icon: "minus" },
  }[sentiment];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: config.color + "22",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 16,
      }}
    >
      <Feather name={config.icon as "trending-up"} size={12} color={config.color} />
      <Text style={{ color: config.color, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
        {config.label}
      </Text>
    </View>
  );
}

export default function AIInsightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { coins, globalData } = useMarket();
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const styles = makeStyles(colors);

  const generateSummary = useCallback(async () => {
    if (coins.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setError(null);
    try {
      const marketData = {
        coins: coins.slice(0, 10).map((c) => ({
          name: c.name,
          symbol: c.symbol.toUpperCase(),
          price: c.current_price,
          change24h: c.price_change_percentage_24h,
          marketCap: c.market_cap,
          volume: c.total_volume,
        })),
        globalData,
      };
      const result = await fetchAISummary(marketData);
      setSummary(result);
    } catch (err) {
      setError("Unable to generate AI summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [coins, globalData]);

  const topMovers = coins
    .slice()
    .sort((a, b) => Math.abs(b.price_change_percentage_24h) - Math.abs(a.price_change_percentage_24h))
    .slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Text style={styles.title}>AI Insights</Text>
        <Text style={styles.subtitle}>Powered by GPT-5 • Real-time market analysis</Text>
      </View>

      <View style={styles.section}>
        {!summary && !isLoading && !error && (
          <View style={styles.generateCard}>
            <View style={styles.aiIconWrap}>
              <Feather name="cpu" size={28} color={colors.primary} />
            </View>
            <Text style={styles.generateTitle}>Get AI Market Analysis</Text>
            <Text style={styles.generateText}>
              Our AI analyzes current market conditions, top movers, and sentiment to give you a
              concise, actionable summary.
            </Text>
            <TouchableOpacity style={styles.generateBtn} onPress={generateSummary} disabled={coins.length === 0}>
              <Feather name="zap" size={15} color={colors.primaryForeground} />
              <Text style={styles.generateBtnText}>Generate Analysis</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Analyzing market conditions...</Text>
            <Text style={styles.loadingSubtext}>Processing real-time data</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Feather name="alert-circle" size={36} color={colors.destructive} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={generateSummary}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {summary && !isLoading && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryTitleRow}>
                <Feather name="cpu" size={14} color={colors.primary} />
                <Text style={styles.summaryLabel}>AI Market Summary</Text>
              </View>
              <SentimentBadge sentiment={summary.sentiment} />
            </View>

            <Text style={styles.summaryText}>{summary.text}</Text>

            {summary.keyPoints.length > 0 && (
              <View style={styles.keyPoints}>
                <Text style={styles.keyPointsLabel}>Key Points</Text>
                {summary.keyPoints.map((point, i) => (
                  <View key={i} style={styles.keyPoint}>
                    <View style={styles.keyPointDot} />
                    <Text style={styles.keyPointText}>{point}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.summaryFooter}>
              <Text style={styles.generatedAt}>
                Generated {new Date(summary.generatedAt).toLocaleTimeString()}
              </Text>
              <TouchableOpacity onPress={generateSummary} style={styles.refreshBtn}>
                <Feather name="refresh-cw" size={12} color={colors.primary} />
                <Text style={styles.refreshBtnText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Movers (24h)</Text>
        {topMovers.length === 0 ? (
          <View style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13 }}>
              Loading market data...
            </Text>
          </View>
        ) : (
          topMovers.map((coin) => {
            const isPos = coin.price_change_percentage_24h >= 0;
            return (
              <View key={coin.id} style={styles.moverRow}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 8 }}>
                  <Feather
                    name={isPos ? "arrow-up" : "arrow-down"}
                    size={13}
                    color={isPos ? colors.success : colors.destructive}
                  />
                  <Text style={styles.moverName}>{coin.name}</Text>
                  <Text style={styles.moverSymbol}>{coin.symbol.toUpperCase()}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.moverPrice}>{formatCurrency(coin.current_price)}</Text>
                  <Text
                    style={[
                      styles.moverChange,
                      { color: isPos ? colors.success : colors.destructive },
                    ]}
                  >
                    {isPos ? "+" : ""}{formatPercent(coin.price_change_percentage_24h)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {globalData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Total Market Cap</Text>
              <Text style={styles.overviewValue}>${formatLargeNumber(globalData.totalMarketCap)}</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>BTC Dominance</Text>
              <Text style={styles.overviewValue}>{globalData.btcDominance.toFixed(1)}%</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>24h Market Cap Chg</Text>
              <Text
                style={[
                  styles.overviewValue,
                  { color: globalData.marketCapChange24h >= 0 ? colors.success : colors.destructive },
                ]}
              >
                {globalData.marketCapChange24h >= 0 ? "+" : ""}
                {globalData.marketCapChange24h.toFixed(2)}%
              </Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Top Coins</Text>
              <Text style={styles.overviewValue}>{coins.length}</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: { color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 22 },
    subtitle: {
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      marginTop: 4,
    },
    section: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    sectionTitle: {
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      fontSize: 16,
      marginBottom: 12,
    },
    generateCard: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    aiIconWrap: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary + "22",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    generateTitle: {
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      fontSize: 18,
      marginBottom: 8,
    },
    generateText: {
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      textAlign: "center",
      lineHeight: 19,
      marginBottom: 20,
    },
    generateBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
    },
    generateBtnText: {
      color: colors.primaryForeground,
      fontFamily: "Inter_600SemiBold",
      fontSize: 14,
    },
    loadingCard: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 36,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    loadingText: {
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      fontSize: 15,
      marginTop: 16,
    },
    loadingSubtext: {
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      marginTop: 4,
    },
    errorCard: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    errorText: {
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      textAlign: "center",
      marginTop: 12,
    },
    retryBtn: {
      marginTop: 16,
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 20,
    },
    retryBtnText: {
      color: colors.primaryForeground,
      fontFamily: "Inter_600SemiBold",
      fontSize: 14,
    },
    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    summaryTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    summaryLabel: {
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
      fontSize: 12,
    },
    summaryText: {
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      lineHeight: 21,
    },
    keyPoints: { marginTop: 16 },
    keyPointsLabel: {
      color: colors.mutedForeground,
      fontFamily: "Inter_600SemiBold",
      fontSize: 11,
      letterSpacing: 0.5,
      textTransform: "uppercase",
      marginBottom: 8,
    },
    keyPoint: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginBottom: 6,
    },
    keyPointDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: colors.primary,
      marginTop: 6,
    },
    keyPointText: {
      flex: 1,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      lineHeight: 18,
    },
    summaryFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    generatedAt: {
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 11,
    },
    refreshBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    refreshBtnText: {
      color: colors.primary,
      fontFamily: "Inter_500Medium",
      fontSize: 12,
    },
    moverRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    moverName: {
      color: colors.foreground,
      fontFamily: "Inter_500Medium",
      fontSize: 13,
    },
    moverSymbol: {
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 11,
    },
    moverPrice: {
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      fontSize: 13,
    },
    moverChange: {
      fontFamily: "Inter_500Medium",
      fontSize: 11,
      marginTop: 2,
    },
    overviewGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    overviewItem: {
      flex: 1,
      minWidth: "45%",
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    overviewLabel: {
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 11,
      marginBottom: 4,
    },
    overviewValue: {
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      fontSize: 15,
    },
  });
}
