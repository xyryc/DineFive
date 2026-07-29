import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Restaurant } from "@/stores/useRestaurantStore";
import { normalizeImageUri } from "@/utils/userAvatar";
import {
  CARD_WIDTH,
  formatRestaurantDistance,
  getRestaurantImage,
  toNumber,
} from "./utils/mapHelpers";

type Props = {
  item: Restaurant;
  index: number;
  activeCardIndex: number;
  selectedRestaurantId?: string;
  isFreeMode: boolean;
  onPress: () => void;
};

export default function RestaurantCard({
  item,
  index,
  activeCardIndex,
  selectedRestaurantId,
  isFreeMode,
  onPress,
}: Props) {
  const isActive = index === activeCardIndex;
  const isSelected = selectedRestaurantId === item.id;

  const rating = toNumber((item as any).rating ?? (item as any).averageRating, 4.2);
  const addressLabel = item.restaurantAddress || item.city || item.state || "Nearby";
  const itemsCount = toNumber(item.availableFoods ?? (item as any).foodCount, 0);
  const itemsBadge = itemsCount > 0 ? `${itemsCount} Items` : "Open";

  const profileUri = normalizeImageUri(
    (item as any).profile ||
    (item as any).image ||
    (item as any).restaurantImage ||
    (item as any).providerImage ||
    ""
  );

  const imageUri = isFreeMode
    ? ((item as any).image || (item as any).foodImage || (item as any).mealImage || (item as any).profile)
    : getRestaurantImage(item);

  const name = isFreeMode
    ? ((item as any).name || (item as any).title || (item as any).mealName)
    : item.restaurantName;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ width: CARD_WIDTH }}>
      <View
        className={`rounded-3xl bg-white overflow-hidden ${
          isSelected ? "border-2 border-[#FFC107]" : "border border-gray-100"
        } ${isActive ? "scale-100 opacity-100" : "scale-95 opacity-80"}`}
      >
        {/* Free mode: restaurant header strip */}
        {isFreeMode && (
          <View className="flex-row items-center px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <View className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden mr-2 border border-white">
              <Image source={{ uri: profileUri }} className="w-full h-full" resizeMode="cover" />
            </View>
            <Text className="text-xs font-body-bold text-gray-700 flex-1" numberOfLines={1}>
              {item.restaurantName}
            </Text>
            <View className="bg-green-100 px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-body-bold text-green-700 uppercase">Free</Text>
            </View>
          </View>
        )}

        {/* Cover image */}
        <Image source={{ uri: imageUri }} className="w-full h-32" resizeMode="cover" />

        {/* Card body */}
        <View className="px-3.5 py-3">
          {/* Row 1: Name + Items badge */}
          <View className="flex-row items-center justify-between gap-2">
            <Text className="text-base font-heading-semibold text-gray-900 flex-1" numberOfLines={1}>
              {name}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F5C518",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
                gap: 4,
              }}
            >
              <Ionicons name="fast-food-outline" size={11} color="#111827" />
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#111827" }}>
                {itemsBadge}
              </Text>
            </View>
          </View>

          {/* Row 2: Rating + Address */}
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
          <View style={{ height: 1, backgroundColor: "#F3F4F6", marginTop: 14, marginBottom: 14 }} />

          {/* Row 3: Distance + CTA */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <Ionicons name="navigate-outline" size={13} color="#F5C518" />
              <Text className="text-[11px] font-body-bold text-gray-800 ml-1">
                {formatRestaurantDistance(item.distance)}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-[#F5C518] px-4 py-2 rounded-full shadow-sm active:opacity-80"
              onPress={onPress}
            >
              <Text className="text-gray-900 font-body-bold text-[11px] uppercase tracking-wide">
                View Details
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
