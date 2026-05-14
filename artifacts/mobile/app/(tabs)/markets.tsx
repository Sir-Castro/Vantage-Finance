import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MarketRow } from "@/components/MarketRow";
import { MarketRowSkeleton } from "@/components/SkeletonLoader";
import { CoinMarket, useMarket } from "@/context/MarketContext";
import { useColors } from "@/hooks/useColors";
import { formatCurrency, formatLargeNumber } from "@/utils/format";

type SortKey = "market_cap" | "price_change" | "price" | "volume";

export default function MarketsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { coins, isLoading, isError, refresh, globalData } = useMarket();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("market_cap");
  const [sortAsc, setSortAsc] = useState(false);
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const filtered = useMemo(() => {
    let result = [...coins];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      let diff = 0;
      switch (sortKey) {
        case "market_cap": diff = a.market_cap - b.market_cap; break;
        case "price_change": diff = a.price_change_percentage_24h - b.price_change_percentage_24h; break;
        case "price": diff = a.current_price - b.current_price; break;
        case "volume": diff = a.total_volume - b.total_volume; break;
      }
      return sortAsc ? diff : -diff;
    });
    return result;
  }, [coins, search, sortKey, sortAsc]);

  const styles = makeStyles(colors);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortBtn = ({ label, k }: { label: string; k: SortKey }) => (
    <TouchableOpacity
      onPress={() => toggleSort(k)}
      style={[styles.sortBtn, sortKey === k && styles.sortBtnActive]}
    >
      <Text style={[styles.sortBtnText, sortKey === k && styles.sortBtnTextActive]}>{label}</Text>
      {sortKey === k && (
        <Feather name={sortAsc ? "chevron-up" : "chevron-down"} size={11} color={colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container]}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Text style={styles.title}>Markets</Text>
        {globalData && (
          <View style={styles.globalStats}>
            <View style={styles.globalItem}>
              <Text style={styles.globalLabel}>Total Mkt Cap</Text>
              <Text style={styles.globalValue}>${formatLargeNumber(globalData.totalMarketCap)}</Text>
            </View>
            <View style={styles.globalItem}>
              <Text style={styles.globalLabel}>BTC Dom</Text>
              <Text style={styles.globalValue}>{globalData.btcDominance.toFixed(1)}%</Text>
            </View>
            <View style={styles.globalItem}>
              <Text style={styles.globalLabel}>24h Change</Text>
              <Text
                style={[
                  styles.globalValue,
                  {
                    color:
                      globalData.marketCapChange24h >= 0 ? colors.success : colors.destructive,
                  },
                ]}
              >
                {globalData.marketCapChange24h >= 0 ? "+" : ""}
                {globalData.marketCapChange24h.toFixed(2)}%
              </Text>
            </View>
          </View>
        )}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Feather name="search" size={15} color={colors.mutedForeground} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search coins..."
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.sortRow}>
          <SortBtn label="Mkt Cap" k="market_cap" />
          <SortBtn label="Price" k="price" />
          <SortBtn label="24h %" k="price_change" />
          <SortBtn label="Volume" k="volume" />
        </View>
      </View>

      {isLoading && coins.length === 0 ? (
        <View>
          {Array.from({ length: 8 }).map((_, i) => (
            <MarketRowSkeleton key={i} />
          ))}
        </View>
      ) : isError ? (
        <View style={styles.errorState}>
          <Feather name="wifi-off" size={40} color={colors.mutedForeground} />
          <Text style={styles.errorText}>Unable to load market data</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MarketRow coin={item} />}
          contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.errorState}>
              <Feather name="search" size={36} color={colors.mutedForeground} />
              <Text style={styles.errorText}>No coins found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    title: {
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      fontSize: 22,
      marginBottom: 12,
    },
    globalStats: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    globalItem: { flex: 1, alignItems: "center" },
    globalLabel: {
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 10,
      marginBottom: 3,
    },
    globalValue: {
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      fontSize: 12,
    },
    searchRow: { marginBottom: 8 },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      fontSize: 14,
    },
    sortRow: { flexDirection: "row", gap: 6, paddingVertical: 4 },
    sortBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sortBtnActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "15",
    },
    sortBtnText: {
      color: colors.mutedForeground,
      fontFamily: "Inter_500Medium",
      fontSize: 11,
    },
    sortBtnTextActive: { color: colors.primary },
    errorState: { alignItems: "center", paddingTop: 64 },
    errorText: {
      color: colors.mutedForeground,
      fontFamily: "Inter_500Medium",
      fontSize: 15,
      marginTop: 12,
    },
    retryBtn: {
      marginTop: 16,
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 20,
    },
    retryText: {
      color: colors.primaryForeground,
      fontFamily: "Inter_600SemiBold",
      fontSize: 14,
    },
  });
}
