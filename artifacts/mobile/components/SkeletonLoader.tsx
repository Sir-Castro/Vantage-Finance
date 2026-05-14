import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = "100%", height = 16, borderRadius, style }: SkeletonProps) {
  const colors = useColors();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius: borderRadius ?? colors.radius / 2,
          backgroundColor: colors.muted,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function HoldingCardSkeleton() {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.card,
        borderRadius: colors.radius,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Skeleton width={38} height={38} borderRadius={19} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Skeleton width="50%" height={14} style={{ marginBottom: 6 }} />
        <Skeleton width="35%" height={11} />
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Skeleton width={70} height={14} style={{ marginBottom: 6 }} />
        <Skeleton width={55} height={11} />
      </View>
    </View>
  );
}

export function MarketRowSkeleton() {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Skeleton width={36} height={36} borderRadius={18} style={{ marginRight: 12 }} />
        <View>
          <Skeleton width={80} height={14} style={{ marginBottom: 5 }} />
          <Skeleton width={40} height={11} />
        </View>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Skeleton width={70} height={14} style={{ marginBottom: 5 }} />
        <Skeleton width={45} height={11} />
      </View>
    </View>
  );
}
