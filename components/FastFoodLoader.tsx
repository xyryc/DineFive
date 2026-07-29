import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";

interface FastFoodLoaderProps {
  message?: string;
  subtitle?: string;
}

export const FastFoodLoader: React.FC<FastFoodLoaderProps> = ({
  message = "Loading...",
  subtitle = "Preparing fresh items for you",
}) => {
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [spinAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 700,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [pulseAnim, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View className="flex-1 bg-white items-center justify-center p-6">
      <StatusBar style="dark" />

      {/* Outer Pulse Circle */}
      <Animated.View
        style={{
          transform: [{ scale: pulseAnim }],
        }}
        className="w-24 h-24 rounded-full bg-[#FFCD39]/20 items-center justify-center relative mb-5"
      >
        {/* Spinning Dashed Ring */}
        <Animated.View
          style={{
            transform: [{ rotate: spin }],
            position: "absolute",
            width: 90,
            height: 90,
            borderRadius: 45,
            borderWidth: 2,
            borderColor: "#FFCD39",
            borderStyle: "dashed",
          }}
        />

        {/* Center Fast Food Icon */}
        <View className="w-16 h-16 rounded-full bg-[#FFCD39] items-center justify-center shadow-sm">
          <Ionicons name="fast-food-outline" size={30} color="#000000" />
        </View>
      </Animated.View>

      {/* Loading Message */}
      <Text className="text-gray-900 font-heading-bold text-lg text-center tracking-tight">
        {message}
      </Text>

      {/* Subtitle */}
      <Text className="text-gray-400 font-body-medium text-xs text-center mt-1">
        {subtitle}
      </Text>
    </View>
  );
};

export default FastFoodLoader;
