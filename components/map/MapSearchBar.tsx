import React from "react";
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatRadius, RADIUS_STEPS } from "./utils/mapHelpers";

type Props = {
  searchText: string;
  onSearchChange: (text: string) => void;
  addressLabel: string;
  radiusMeters: number;
  onAutoLocate: () => void;
  onPickerPress: () => void;
  onRadiusPress: (radius: number) => void;
};

export default function MapSearchBar({
  searchText,
  onSearchChange,
  addressLabel,
  radiusMeters,
  onAutoLocate,
  onPickerPress,
  onRadiusPress,
}: Props) {
  return (
    <View className="absolute top-4 left-4 right-4">
      {/* Search row */}
      <View className="flex-row items-center">
        <View className="bg-white p-1.5 rounded-xl shadow-md mr-3 border border-gray-100">
          <Image
            source={require("@/assets/images/icon.png")}
            style={{ width: 34, height: 34 }}
            resizeMode="contain"
          />
        </View>

        <View className="flex-1 bg-white rounded-full h-[46px] shadow-md flex-row items-center px-4 border border-gray-100">
          <View className="flex-row items-center flex-1">
            <Ionicons name="search-outline" size={20} color="#D1D5DB" />
            <TextInput
              value={searchText}
              onChangeText={onSearchChange}
              placeholder="Search"
              placeholderTextColor="#D1D5DB"
              className="flex-1 ml-2 text-[15px] text-gray-700"
            />
          </View>

          <TouchableOpacity onPress={onAutoLocate} className="p-1">
            <Ionicons name="locate-outline" size={20} color="#FFC107" />
          </TouchableOpacity>

          <View className="w-[1px] h-5 bg-gray-200 mx-2" />

          <TouchableOpacity onPress={onPickerPress} className="flex-row items-center">
            <Ionicons name="location-sharp" size={18} color="#9CA3AF" />
            <Text
              className="ml-1 text-[14px] text-[#9CA3AF] font-body-medium max-w-[120px]"
              numberOfLines={1}
            >
              {addressLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Radius filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-2"
        contentContainerStyle={{ gap: 6, paddingHorizontal: 2 }}
      >
        {RADIUS_STEPS.map((radius) => {
          const active = radius === radiusMeters;
          return (
            <TouchableOpacity
              key={radius}
              onPress={() => onRadiusPress(radius)}
              className={`px-3 py-1.5 rounded-full border ${
                active ? "bg-[#FFC107] border-[#FFC107]" : "bg-white border-gray-200"
              }`}
            >
              <Text
                className={`text-xs font-body-semibold ${
                  active ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {formatRadius(radius)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
