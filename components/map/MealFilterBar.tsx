import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type MealFilter = "all" | "free";

type Props = {
  mealFilter: MealFilter;
  onSelectAll: () => void;
  onSelectFree: () => void;
};

export default function MealFilterBar({ mealFilter, onSelectAll, onSelectFree }: Props) {
  return (
    <View className="flex-row justify-center gap-3 px-4 mb-4">
      <TouchableOpacity
        onPress={onSelectAll}
        className={`flex-1 flex-row items-center justify-center px-4 py-2.5 rounded-full shadow-lg border ${
          mealFilter === "all" ? "bg-[#FFC107] border-white" : "bg-white border-gray-100"
        }`}
        activeOpacity={0.8}
      >
        <Ionicons name="restaurant" size={16} color={mealFilter === "all" ? "#000" : "#6B7280"} />
        <Text
          className={`font-body-bold text-[12px] ml-2 uppercase tracking-tight ${
            mealFilter === "all" ? "text-gray-900" : "text-gray-500"
          }`}
        >
          Meal near you
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSelectFree}
        className={`flex-1 flex-row items-center justify-center px-4 py-2.5 rounded-full shadow-lg border ${
          mealFilter === "free" ? "bg-[#FFC107] border-white" : "bg-white border-gray-100"
        }`}
        activeOpacity={0.8}
      >
        <Ionicons name="gift" size={16} color={mealFilter === "free" ? "#000" : "#6B7280"} />
        <Text
          className={`font-body-bold text-[12px] ml-2 uppercase tracking-tight ${
            mealFilter === "free" ? "text-gray-900" : "text-gray-500"
          }`}
        >
          Free meal near you
        </Text>
      </TouchableOpacity>
    </View>
  );
}
