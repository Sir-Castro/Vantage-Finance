import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { formatCurrency, formatTimeAgo } from "@/utils/format";

export interface RiskAlert {
  id: string;
  type: "price_drop" | "price_surge" | "portfolio_loss" | "price_target";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  coinId?: string;
  symbol?: string;
  timestamp: number;
}

interface AlertCardProps {
  alert: RiskAlert;
}

function getSeverityColor(severity: string, colors: ReturnType<typeof useColors>) {
  switch (severity) {
    case "critical": return colors.destructive;
    case "high": return "#FF6B35";
    case "medium": return colors.accent;
    default: return colors.info;
  }
}

export function AlertCard({ alert }: AlertCardProps) {
  const colors = useColors();
  const severityColor = getSeverityColor(alert.severity, colors);
  const styles = makeStyles(colors, severityColor);

  const icon =
    alert.type === "price_drop" || alert.type === "portfolio_loss"
      ? "trending-down"
      : alert.type === "price_surge"
      ? "trending-up"
      : "target";

  return (
    <View style={styles.card}>
      <View style={[styles.indicator, { backgroundColor: severityColor }]} />
      <View style={styles.iconWrap}>
        <Feather name={icon as "trending-down"} size={16} color={severityColor} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{alert.title}</Text>
          <View style={[styles.badge, { backgroundColor: severityColor + "22" }]}>
            <Text style={[styles.badgeText, { color: severityColor }]}>
              {alert.severity.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.message}>{alert.message}</Text>
        <Text style={styles.time}>{formatTimeAgo(alert.timestamp)}</Text>
      </View>
    </View>
  );
}

interface WhaleAlertCardProps {
  coinId: string;
  symbol: string;
  name: string;
  type: "large_buy" | "large_sell" | "volume_spike";
  usdValue: number;
  severity: "low" | "medium" | "high";
  timestamp: number;
}

export function WhaleAlertCard({ symbol, name, type, usdValue, severity, timestamp }: WhaleAlertCardProps) {
  const colors = useColors();
  const severityColor = getSeverityColor(severity, colors);
  const styles = makeStyles(colors, severityColor);

  const typeLabel =
    type === "large_buy" ? "Large Buy" : type === "large_sell" ? "Large Sell" : "Volume Spike";
  const iconName =
    type === "large_buy" ? "arrow-up-circle" : type === "large_sell" ? "arrow-down-circle" : "activity";

  return (
    <View style={styles.card}>
      <View style={[styles.indicator, { backgroundColor: severityColor }]} />
      <View style={styles.iconWrap}>
        <Feather name={iconName as "activity"} size={16} color={severityColor} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Whale {typeLabel} — {symbol}
          </Text>
          <View style={[styles.badge, { backgroundColor: severityColor + "22" }]}>
            <Text style={[styles.badgeText, { color: severityColor }]}>
              {severity.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.message}>
          {name}: {formatCurrency(usdValue)} detected on-chain
        </Text>
        <Text style={styles.time}>{formatTimeAgo(timestamp)}</Text>
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, _severityColor: string) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      marginBottom: 8,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    indicator: {
      width: 3,
    },
    iconWrap: {
      padding: 14,
      paddingRight: 10,
      justifyContent: "flex-start",
      paddingTop: 16,
    },
    content: {
      flex: 1,
      padding: 14,
      paddingLeft: 0,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    title: {
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      fontSize: 13,
      flex: 1,
      marginRight: 8,
    },
    badge: {
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    badgeText: {
      fontFamily: "Inter_700Bold",
      fontSize: 9,
      letterSpacing: 0.5,
    },
    message: {
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      lineHeight: 17,
    },
    time: {
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 11,
      marginTop: 6,
    },
  });
}
