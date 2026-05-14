import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo } from "react";
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

import { HoldingCard } from "@/components/HoldingCard";
import { HoldingCardSkeleton } from "@/components/SkeletonLoader";
import { useMarket } from "@/context/MarketContext";
import { usePortfolio } from "@/context/PortfolioContext";
import { useColors } from "@/hooks/useColors";
import { formatCurrency, formatPercent } from "@/utils/format";

export default function PortfolioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { holdings, isLoading: portfolioLoading } = usePortfolio();
  const { coins, isLoading: marketLoading, refresh } = useMarket();

  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const portfolioStats = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    for (const holding of holdings) {
      const coin = coins.find((c) => c.id === holding.coinId);
      const price = coin?.current_price ?? holding.avgBuyPrice;
      totalValue += holding.amount * price;
      totalCost += holding.amount * holding.avgBuyPrice;
    }
    const pnl = totalValue - totalCost;
    const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
    return { totalValue, totalCost, pnl, pnlPercent };
  }, [holdings, coins]);

  const isLoading = portfolioLoading || (marketLoading && coins.length === 0);
  const isGain = portfolioStats.pnl >= 0;
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const styles = makeStyles(colors);

  return (
    <ScrollView
      style={[styles.container]}
      contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <Text style={styles.headerLabel}>Portfolio Value</Text>
        <Text style={styles.totalValue}>{formatCurrency(portfolioStats.totalValue)}</Text>
        <View style={styles.pnlRow}>
          <Feather
            name={isGain ? "trending-up" : "trending-down"}
            size={14}
            color={isGain ? colors.success : colors.destructive}
          />
          <Text style={[styles.pnl, { color: isGain ? colors.success : colors.destructive }]}>
            {" "}{isGain ? "+" : ""}{formatCurrency(portfolioStats.pnl)} (
            {isGain ? "+" : ""}{formatPercent(portfolioStats.pnlPercent)})
          </Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Invested</Text>
            <Text style={styles.statValue}>{formatCurrency(portfolioStats.totalCost)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Assets</Text>
            <Text style={styles.statValue}>{holdings.length}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>P&L</Text>
            <Text style={[styles.statValue, { color: isGain ? colors.success : colors.destructive }]}>
              {isGain ? "+" : ""}{formatPercent(portfolioStats.pnlPercent)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Holdings</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/add-holding");
            }}
          >
            <Feather name="plus" size={16} color={colors.primary} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <>
            <HoldingCardSkeleton />
            <HoldingCardSkeleton />
            <HoldingCardSkeleton />
          </>
        ) : holdings.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="briefcase" size={40} color={colors.mutedForeground} />
            <Text style={styles.emptyTitle}>No holdings yet</Text>
            <Text style={styles.emptyText}>Add your first crypto position to start tracking</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push("/add-holding")}
            >
              <Text style={styles.emptyBtnText}>Add Holding</Text>
            </TouchableOpacity>
          </View>
        ) : (
          holdings.map((holding) => {
            const coin = coins.find((c) => c.id === holding.coinId);
            return <HoldingCard key={holding.id} holding={holding} coin={coin} />;
          })
        )}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 20,
      paddingBottom: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLabel: {
      color: colors.mutedForeground,
      fontFamily: "Inter_500Medium",
      fontSize: 12,
      letterSpacing: 0.5,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    totalValue: {
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      fontSize: 40,
      letterSpacing: -1,
    },
    pnlRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
    },
    pnl: {
      fontFamily: "Inter_500Medium",
      fontSize: 14,
    },
    statsRow: {
      flexDirection: "row",
      marginTop: 20,
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statItem: {
      flex: 1,
      alignItems: "center",
    },
    statLabel: {
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 11,
      marginBottom: 4,
    },
    statValue: {
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      fontSize: 15,
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.border,
    },
    section: {
      padding: 16,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    sectionTitle: {
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      fontSize: 18,
    },
    addBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.primary + "1A",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    addBtnText: {
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
      fontSize: 13,
    },
    empty: {
      alignItems: "center",
      paddingVertical: 48,
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
    emptyBtn: {
      marginTop: 20,
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
    },
    emptyBtnText: {
      color: colors.primaryForeground,
      fontFamily: "Inter_600SemiBold",
      fontSize: 14,
    },
  });
}
