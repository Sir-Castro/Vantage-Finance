import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AlertCard, RiskAlert, WhaleAlertCard } from "@/components/AlertCard";
import { useMarket } from "@/context/MarketContext";
import { usePortfolio } from "@/context/PortfolioContext";
import { useColors } from "@/hooks/useColors";
import { formatPercent } from "@/utils/format";

type Tab = "risk" | "whale";

function generateRiskAlerts(
  holdings: ReturnType<typeof usePortfolio>["holdings"],
  coins: ReturnType<typeof useMarket>["coins"]
): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  let totalValue = 0;
  let totalCost = 0;

  for (const holding of holdings) {
    const coin = coins.find((c) => c.id === holding.coinId);
    if (!coin) continue;
    const value = holding.amount * coin.current_price;
    const cost = holding.amount * holding.avgBuyPrice;
    totalValue += value;
    totalCost += cost;
    const pnlPct = cost > 0 ? ((value - cost) / cost) * 100 : 0;
    const change24h = coin.price_change_percentage_24h;

    if (change24h <= -10) {
      alerts.push({
        id: `drop_${holding.id}`,
        type: "price_drop",
        severity: "critical",
        title: `${coin.name} Crashed`,
        message: `${coin.symbol.toUpperCase()} dropped ${formatPercent(Math.abs(change24h))} in 24h. Your position is down significantly.`,
        coinId: coin.id,
        symbol: coin.symbol,
        timestamp: Date.now() - 600000,
      });
    } else if (change24h <= -5) {
      alerts.push({
        id: `drop_${holding.id}`,
        type: "price_drop",
        severity: "high",
        title: `${coin.name} Dropped`,
        message: `${coin.symbol.toUpperCase()} fell ${formatPercent(Math.abs(change24h))} in the last 24 hours.`,
        coinId: coin.id,
        symbol: coin.symbol,
        timestamp: Date.now() - 1800000,
      });
    } else if (change24h >= 10) {
      alerts.push({
        id: `surge_${holding.id}`,
        type: "price_surge",
        severity: "medium",
        title: `${coin.name} Surging`,
        message: `${coin.symbol.toUpperCase()} is up ${formatPercent(change24h)} in 24h. Consider taking partial profits.`,
        coinId: coin.id,
        symbol: coin.symbol,
        timestamp: Date.now() - 900000,
      });
    } else if (change24h >= 5) {
      alerts.push({
        id: `surge_${holding.id}`,
        type: "price_surge",
        severity: "low",
        title: `${coin.name} Rising`,
        message: `${coin.symbol.toUpperCase()} gained ${formatPercent(change24h)} in the last 24 hours.`,
        coinId: coin.id,
        symbol: coin.symbol,
        timestamp: Date.now() - 3600000,
      });
    }
  }

  if (totalCost > 0) {
    const portfolioPnlPct = ((totalValue - totalCost) / totalCost) * 100;
    if (portfolioPnlPct <= -15) {
      alerts.unshift({
        id: "portfolio_loss_critical",
        type: "portfolio_loss",
        severity: "critical",
        title: "Portfolio Risk Alert",
        message: `Your portfolio is down ${formatPercent(Math.abs(portfolioPnlPct))} overall. Review your positions.`,
        timestamp: Date.now() - 300000,
      });
    } else if (portfolioPnlPct <= -8) {
      alerts.unshift({
        id: "portfolio_loss_high",
        type: "portfolio_loss",
        severity: "high",
        title: "Portfolio Down",
        message: `Your total portfolio has declined ${formatPercent(Math.abs(portfolioPnlPct))} from cost basis.`,
        timestamp: Date.now() - 1200000,
      });
    }
  }

  return alerts.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });
}

export default function AlertsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { holdings } = usePortfolio();
  const { coins, whaleAlerts, isLoading, refresh } = useMarket();
  const [activeTab, setActiveTab] = useState<Tab>("risk");
  const [refreshing, setRefreshing] = useState(false);
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const riskAlerts = useMemo(
    () => generateRiskAlerts(holdings, coins),
    [holdings, coins]
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const styles = makeStyles(colors);

  const criticalCount = riskAlerts.filter(
    (a) => a.severity === "critical" || a.severity === "high"
  ).length;
  const highWhaleCount = whaleAlerts.filter((a) => a.severity === "high").length;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Text style={styles.title}>Alerts</Text>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "risk" && styles.tabActive]}
            onPress={() => setActiveTab("risk")}
          >
            <Text style={[styles.tabText, activeTab === "risk" && styles.tabTextActive]}>
              Risk Alerts
            </Text>
            {criticalCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{criticalCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "whale" && styles.tabActive]}
            onPress={() => setActiveTab("whale")}
          >
            <Text style={[styles.tabText, activeTab === "whale" && styles.tabTextActive]}>
              Whale Activity
            </Text>
            {highWhaleCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                <Text style={styles.badgeText}>{highWhaleCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 + insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "risk" ? (
          riskAlerts.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="shield" size={44} color={colors.success} />
              <Text style={styles.emptyTitle}>All Clear</Text>
              <Text style={styles.emptyText}>
                {holdings.length === 0
                  ? "Add holdings to your portfolio to start monitoring risk"
                  : "No risk alerts for your current positions"}
              </Text>
            </View>
          ) : (
            riskAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
          )
        ) : isLoading && whaleAlerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="loader" size={36} color={colors.mutedForeground} />
            <Text style={styles.emptyText}>Loading whale data...</Text>
          </View>
        ) : whaleAlerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="activity" size={44} color={colors.mutedForeground} />
            <Text style={styles.emptyTitle}>No Whale Activity</Text>
            <Text style={styles.emptyText}>No unusual large transactions detected right now</Text>
          </View>
        ) : (
          <>
            <View style={styles.whaleHeader}>
              <Feather name="alert-circle" size={13} color={colors.mutedForeground} />
              <Text style={styles.whaleHeaderText}>
                Detected from abnormal volume-to-market-cap ratios
              </Text>
            </View>
            {whaleAlerts.map((alert) => (
              <WhaleAlertCard
                key={alert.id}
                coinId={alert.coinId}
                symbol={alert.symbol}
                name={alert.name}
                type={alert.type}
                usdValue={alert.usdValue}
                severity={alert.severity}
                timestamp={alert.timestamp}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      fontSize: 22,
      marginBottom: 12,
    },
    tabs: {
      flexDirection: "row",
      gap: 4,
    },
    tab: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabActive: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      color: colors.mutedForeground,
      fontFamily: "Inter_500Medium",
      fontSize: 13,
    },
    tabTextActive: {
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
    },
    badge: {
      backgroundColor: colors.destructive,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    badgeText: {
      color: "#FFFFFF",
      fontFamily: "Inter_700Bold",
      fontSize: 9,
    },
    scroll: { flex: 1 },
    emptyState: {
      alignItems: "center",
      paddingTop: 64,
    },
    emptyTitle: {
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      fontSize: 18,
      marginTop: 16,
    },
    emptyText: {
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      textAlign: "center",
      marginTop: 6,
      paddingHorizontal: 32,
    },
    whaleHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 12,
    },
    whaleHeaderText: {
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 11,
      flex: 1,
    },
  });
}
