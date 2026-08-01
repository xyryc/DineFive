import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function RoleSelectionScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Branding */}
        <View className="items-center mt-2 mb-6">
          <Image
            source={require("@/assets/images/logo.jpg")}
            contentFit="contain"
            style={{ width: 130, height: 130 }}
          />
          <Text className="text-2xl font-heading text-gray-900 mt-1 text-center">
            Welcome to DineFive
          </Text>
          <Text className="text-xs font-body text-gray-500 text-center mt-1">
            Choose how you would like to continue
          </Text>
        </View>

        {/* Role Cards Container */}
        <View className="flex-1 justify-center gap-y-5">

          {/* Option 1: Customer Card */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/(auth)/login")}
            className="bg-white rounded-3xl border border-amber-200 shadow-sm overflow-hidden p-5"
          >
            {/* Header Row */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-2xl bg-amber-500 items-center justify-center mr-3">
                  <Ionicons name="person" size={24} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-heading text-gray-900 leading-tight">
                    Customer / Diner
                  </Text>
                  <Text className="text-xs font-body-semibold text-amber-700 mt-0.5">
                    Food Pickup & Meal Donations
                  </Text>
                </View>
              </View>

              <View className="bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full">
                <Text className="text-[10px] font-body-bold text-amber-900 uppercase">
                  Diner
                </Text>
              </View>
            </View>

            {/* Description */}
            <Text className="text-xs font-body text-gray-600 leading-relaxed mb-4">
              Enjoy fresh, affordable meals from top local restaurants and help support meal donation initiatives.
            </Text>

            {/* Feature Bullet Points */}
            <View className="bg-amber-50/80 p-3 rounded-2xl border border-amber-100 mb-4 gap-y-2">
              <View className="flex-row items-center gap-x-2">
                <Ionicons name="checkmark-circle" size={16} color="#D97706" />
                <Text className="text-xs font-body-semibold text-gray-800 flex-1">
                  Discover & order nearby meals for pickup
                </Text>
              </View>
              <View className="flex-row items-center gap-x-2">
                <Ionicons name="checkmark-circle" size={16} color="#D97706" />
                <Text className="text-xs font-body-semibold text-gray-800 flex-1">
                  Donate meals to support community members
                </Text>
              </View>
              <View className="flex-row items-center gap-x-2">
                <Ionicons name="checkmark-circle" size={16} color="#D97706" />
                <Text className="text-xs font-body-semibold text-gray-800 flex-1">
                  Fast, secure checkout & order tracking
                </Text>
              </View>
            </View>

            {/* CTA Button */}
            <View className="bg-[#F5C518] rounded-2xl py-3 px-4 flex-row items-center justify-between">
              <Text className="text-sm font-heading-semibold text-gray-950">
                Continue as Customer
              </Text>
              <View className="w-7 h-7 rounded-full bg-black/10 items-center justify-center">
                <Ionicons name="arrow-forward" size={16} color="#000000" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Option 2: Restaurant Owner Card */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/(auth)/restaurant-partner")}
            className="bg-white rounded-3xl border border-orange-200 shadow-sm overflow-hidden p-5"
          >
            {/* Header Row */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-2xl bg-[#FF6B35] items-center justify-center mr-3">
                  <Ionicons name="restaurant" size={24} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-heading text-gray-900 leading-tight">
                    Restaurant Owner
                  </Text>
                  <Text className="text-xs font-body-semibold text-[#FF6B35] mt-0.5">
                    Extra Revenue During Slow Hours
                  </Text>
                </View>
              </View>

              <View className="bg-orange-100 border border-orange-200 px-2.5 py-1 rounded-full">
                <Text className="text-[10px] font-body-bold text-[#FF6B35] uppercase">
                  Partner
                </Text>
              </View>
            </View>

            {/* Description */}
            <Text className="text-xs font-body text-gray-600 leading-relaxed mb-4">
              Sell meals you might not have sold anyway. Maximize revenue without changing menus or hiring extra staff.
            </Text>

            {/* Feature Bullet Points */}
            <View className="bg-orange-50/80 p-3 rounded-2xl border border-orange-100 mb-4 gap-y-2">
              <View className="flex-row items-center gap-x-2">
                <Ionicons name="trending-up" size={16} color="#FF6B35" />
                <Text className="text-xs font-body-semibold text-gray-800 flex-1">
                  {"Earn up to "}
                  <Text className="font-body-bold text-[#FF6B35]">$64,000+/year</Text>
                  {" in extra sales"}
                </Text>
              </View>
              <View className="flex-row items-center gap-x-2">
                <Ionicons name="checkmark-circle" size={16} color="#FF6B35" />
                <Text className="text-xs font-body-semibold text-gray-800 flex-1">
                  Zero menu changes & zero extra staff needed
                </Text>
              </View>
              <View className="flex-row items-center gap-x-2">
                <Ionicons name="checkmark-circle" size={16} color="#FF6B35" />
                <Text className="text-xs font-body-semibold text-gray-800 flex-1">
                  Turn off-peak slow hours into pure margin
                </Text>
              </View>
            </View>

            {/* CTA Button */}
            <View className="bg-[#FF6B35] rounded-2xl py-3 px-4 flex-row items-center justify-between">
              <Text className="text-sm font-heading-semibold text-white">
                Explore Owner Opportunity
              </Text>
              <View className="w-7 h-7 rounded-full bg-white/20 items-center justify-center">
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>

        </View>

        {/* Footer info */}
        <View className="items-center mt-6 mb-2">
          <Text className="text-[11px] font-body text-gray-400 text-center">
            DineFive Mobile • Partner Portal © 2026
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
