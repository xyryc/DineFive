import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Restaurant } from "@/stores/useRestaurantStore";
import { normalizeImageUri } from "@/utils/userAvatar";
import {
  CARD_WIDTH,
  formatRestaurantDistance,
  toNumber,
} from "./utils/mapHelpers";

type Props = {
  item: Restaurant;
  index: number;
  activeCardIndex: number;
  selectedRestaurantId?: string;
  onPress: () => void;
};

export default function FoodCard({
  item,
  index,
  activeCardIndex,
  selectedRestaurantId,
  onPress,
}: Props) {
  const isActive = index === activeCardIndex;
  const isSelected = selectedRestaurantId === item.id;

  const rating = toNumber((item as any).rating ?? (item as any).averageRating, 4.5);
  const addressLabel = item.restaurantAddress || item.city || item.state || "Nearby";

  const profileUri = normalizeImageUri(
    (item as any).profile ||
    (item as any).image ||
    (item as any).restaurantImage ||
    (item as any).providerImage ||
    ""
  );

  const mealImageUri = normalizeImageUri(
    (item as any).image ||
    (item as any).foodImage ||
    (item as any).mealImage ||
    (item as any).profile ||
    ""
  );

  const mealName =
    (item as any).name ||
    (item as any).title ||
    (item as any).mealName ||
    "Free Meal Deal";

  const restaurantName = item.restaurantName || "Local Restaurant";

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ width: CARD_WIDTH }}>
      <View
        className={`rounded-3xl bg-white overflow-hidden ${
          isSelected ? "border-2 border-green-500 shadow-md" : "border border-gray-100 shadow-sm"
        } ${isActive ? "scale-100 opacity-100" : "scale-95 opacity-80"}`}
      >
        {/* Restaurant Header Strip */}
        <View className="flex-row items-center px-3.5 py-2 bg-emerald-50/70 border-b border-emerald-100/80">
          <View className="w-6 h-6 rounded-full bg-emerald-200 overflow-hidden mr-2 border border-white">
            {profileUri ? (
              <Image source={{ uri: profileUri }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <Ionicons name="restaurant" size={14} color="#047857" style={{ margin: "auto" }} />
            )}
          </View>
          <Text className="text-xs font-body-bold text-gray-800 flex-1" numberOfLines={1}>
            {restaurantName}
          </Text>
          <View className="bg-emerald-500 px-2 py-0.5 rounded-full">
            <Text className="text-[10px] font-body-bold text-white uppercase tracking-wider">Free Meal</Text>
          </View>
        </View>

        {/* Cover Meal Image */}
        <View className="relative w-full h-32 bg-gray-100">
          <Image source={{ uri: mealImageUri }} className="w-full h-full" resizeMode="cover" />
        </View>

        {/* Card Body */}
        <View className="px-3.5 py-3">
          {/* Row 1: Food Meal Title */}
          <View className="flex-row items-center justify-between gap-2">
            <Text className="text-base font-heading-semibold text-gray-900 flex-1" numberOfLines={1}>
              {mealName}
            </Text>
            <View className="flex-row items-center bg-emerald-100 px-2 py-0.5 rounded-full">
              <Ionicons name="gift-outline" size={12} color="#047857" />
              <Text className="text-[10px] font-body-bold text-emerald-800 ml-1">$0.00</Text>
            </View>
          </View>

          {/* Row 2: Rating & Address */}
          <View className="flex-row items-center mt-1.5 gap-1.5">
            <View className="flex-row items-center bg-gray-50 px-1.5 py-0.5 rounded-md">
              <Ionicons name="star" size={11} color="#F5C518" />
              <Text className="text-[11px] font-body-bold text-gray-800 ml-1">
                {rating.toFixed(1)}
              </Text>
            </View>
            <Text className="text-gray-300 text-xs">•</Text>
            <Ionicons name="location-outline" size={12} color="#6B7280" />
            <Text className="text-xs font-body text-gray-500 flex-1" numberOfLines={1}>
              {addressLabel}
            </Text>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: "#F3F4F6", marginTop: 12, marginBottom: 12 }} />

          {/* Row 3: Distance + Claim CTA */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
              <Ionicons name="navigate-outline" size={12} color="#059669" />
              <Text className="text-[11px] font-body-bold text-gray-800 ml-1">
                {formatRestaurantDistance(item.distance)}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-emerald-600 px-3.5 py-1.5 rounded-full shadow-sm active:opacity-80 flex-row items-center gap-1"
              onPress={onPress}
            >
              <Text className="text-white font-body-bold text-[11px] uppercase tracking-wide">
                Claim Deal
              </Text>
              <Ionicons name="arrow-forward" size={11} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
