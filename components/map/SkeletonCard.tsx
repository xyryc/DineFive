import React, { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import { CARD_WIDTH } from "./utils/mapHelpers";

export default function SkeletonCard() {
  const [pulseAnim] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.9, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={{ width: CARD_WIDTH, opacity: pulseAnim }}
      className="rounded-3xl bg-white border border-gray-100 overflow-hidden p-3 gap-y-3 shadow-md"
    >
      <View className="w-full h-32 bg-gray-200 rounded-2xl" />
      <View className="h-5 w-3/4 bg-gray-200 rounded-lg" />
      <View className="flex-row items-center gap-x-2">
        <View className="w-4 h-4 bg-gray-200 rounded-full" />
        <View className="h-4 w-12 bg-gray-200 rounded-lg" />
        <View className="h-4 w-20 bg-gray-200 rounded-lg" />
      </View>
      <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
        <View className="flex-row items-center gap-x-1">
          <View className="w-4 h-4 bg-gray-200 rounded-full" />
          <View className="h-4 w-12 bg-gray-200 rounded-lg" />
        </View>
        <View className="h-8 w-24 bg-gray-200 rounded-xl" />
      </View>
    </Animated.View>
  );
}
