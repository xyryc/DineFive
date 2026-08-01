import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const REVENUE_DATA = [
  { meals: "10 Meals", monthly: "$1,797", yearly: "$21,564", popular: false },
  { meals: "20 Meals", monthly: "$3,594", yearly: "$43,128", popular: false },
  { meals: "30 Meals", monthly: "$5,391", yearly: "$64,692", popular: true },
  { meals: "50 Meals", monthly: "$8,985", yearly: "$107,820", popular: false },
  { meals: "100 Meals", monthly: "$17,970", yearly: "$215,640", popular: false },
];

export default function RestaurantPartnerScreen() {
  const router = useRouter();

  const handleOpenDashboard = async () => {
    const url = "https://restaurant.dinefive.com";
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", `Cannot open URL: ${url}`);
      }
    } catch {
      await Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />

      {/* Top Bar Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100 flex-row items-center justify-between shadow-xs">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>

        <Text className="text-base font-heading-semibold text-gray-900">
          Restaurant Partner Program
        </Text>

        <View className="w-10" />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View className="mb-6 rounded-3xl overflow-hidden shadow-sm">
          <LinearGradient
            colors={["#D94A15", "#E8561C", "#FF6B35"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 24 }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="bg-white/20 px-3 py-1 rounded-full border border-white/30">
                <Text className="text-white text-xs font-body-bold tracking-wider uppercase">
                  DineFive Partner
                </Text>
              </View>
              <Ionicons name="cash-outline" size={28} color="#FFE5D9" />
            </View>

            <Text className="text-2xl font-heading text-white mb-2 leading-tight">
              Extra Revenue During Slow Hours
            </Text>
            <Text className="text-sm font-body text-orange-100 leading-relaxed">
              Sell meals you might not have sold anyway and maximize your daily kitchen capacity.
            </Text>
          </LinearGradient>
        </View>

        {/* 4 Checkmark Bullet Points */}
        <View className="bg-white rounded-3xl p-5 border border-orange-100 shadow-sm mb-6 gap-y-3">
          <View className="flex-row items-center">
            <View className="w-7 h-7 rounded-full bg-orange-100 items-center justify-center mr-3">
              <Ionicons name="checkmark-sharp" size={16} color="#FF6B35" />
            </View>
            <Text className="text-sm font-body-semibold text-gray-800">
              No menu changes required
            </Text>
          </View>

          <View className="flex-row items-center">
            <View className="w-7 h-7 rounded-full bg-orange-100 items-center justify-center mr-3">
              <Ionicons name="checkmark-sharp" size={16} color="#FF6B35" />
            </View>
            <Text className="text-sm font-body-semibold text-gray-800">
              No extra kitchen staff needed
            </Text>
          </View>

          <View className="flex-row items-center">
            <View className="w-7 h-7 rounded-full bg-orange-100 items-center justify-center mr-3">
              <Ionicons name="checkmark-sharp" size={16} color="#FF6B35" />
            </View>
            <Text className="text-sm font-body-semibold text-gray-800">
              Use fresh ingredients you already have
            </Text>
          </View>

          <View className="flex-row items-center">
            <View className="w-7 h-7 rounded-full bg-orange-100 items-center justify-center mr-3">
              <Ionicons name="checkmark-sharp" size={16} color="#FF6B35" />
            </View>
            <Text className="text-sm font-body-semibold text-gray-800">
              Turn slow hours into extra income
            </Text>
          </View>
        </View>

        {/* Revenue Projection Table */}
        <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-heading text-gray-900">
              Revenue Projection Table
            </Text>
            <Text className="text-xs font-body text-gray-400">
              $5.99 per meal
            </Text>
          </View>

          {/* Table Header */}
          <View className="flex-row bg-gray-50 rounded-xl p-3 mb-2 border border-gray-100">
            <Text className="flex-1 text-[11px] font-body-bold text-gray-500 uppercase">
              Extra Meals / Day
            </Text>
            <Text className="flex-1 text-[11px] font-body-bold text-gray-500 uppercase text-center">
              Monthly (30 Days)
            </Text>
            <Text className="flex-1 text-[11px] font-body-bold text-gray-500 uppercase text-right">
              Yearly (12 Mos)
            </Text>
          </View>

          {/* Table Rows */}
          {REVENUE_DATA.map((row, idx) => (
            <View
              key={idx}
              className={`flex-row items-center p-3 rounded-xl ${
                row.popular
                  ? "bg-orange-50 border border-orange-200 my-1"
                  : idx % 2 === 0
                  ? "bg-white"
                  : "bg-gray-50/60"
              }`}
            >
              <View className="flex-1 flex-row items-center">
                <Text
                  className={`text-sm ${
                    row.popular
                      ? "font-heading-semibold text-[#FF6B35]"
                      : "font-body-semibold text-gray-800"
                  }`}
                >
                  {row.meals}
                </Text>
                {row.popular && (
                  <View className="bg-[#FF6B35] px-1.5 py-0.5 rounded ml-1.5">
                    <Text className="text-[8px] font-body-bold text-white uppercase">
                      Popular
                    </Text>
                  </View>
                )}
              </View>

              <Text
                className={`flex-1 text-sm text-center ${
                  row.popular
                    ? "font-heading-semibold text-[#FF6B35]"
                    : "font-body-semibold text-gray-700"
                }`}
              >
                {row.monthly}
              </Text>

              <Text
                className={`flex-1 text-sm text-right ${
                  row.popular
                    ? "font-heading-bold text-[#FF6B35]"
                    : "font-body-bold text-gray-900"
                }`}
              >
                {row.yearly}
              </Text>
            </View>
          ))}

          <Text className="text-[11px] font-body text-gray-400 italic text-center mt-3">
            *Based on every DineFive meal selling for $5.99.
          </Text>
        </View>

        {/* The DineFive Opportunity Breakdown Card */}
        <View className="bg-slate-900 rounded-3xl p-6 shadow-sm mb-6 text-white">
          <Text className="text-xl font-heading text-white mb-1">
            The DineFive Opportunity
          </Text>
          <Text className="text-xs font-body-semibold text-orange-400 uppercase tracking-wider mb-4">
            Example: 30 Extra Meals Per Day
          </Text>

          <View className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-body text-slate-400">Daily Revenue</Text>
              <Text className="text-sm font-heading-semibold text-white">30 × $5.99 = $179.70 / day</Text>
            </View>

            <View className="h-px bg-slate-800 my-1" />

            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-body text-slate-400">Monthly Revenue</Text>
              <Text className="text-sm font-heading-semibold text-white">$179.70 × 30 = $5,391 / mo</Text>
            </View>

            <View className="h-px bg-slate-800 my-1" />

            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-body text-slate-400">Yearly Revenue</Text>
              <Text className="text-base font-heading-bold text-[#FF6B35]">$5,391 × 12 = $64,692 / yr</Text>
            </View>
          </View>
        </View>

        {/* Why Restaurants Love DineFive */}
        <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-6">
          <Text className="text-base font-heading text-gray-900 mb-4">
            Why Restaurants Love DineFive
          </Text>

          <View className="space-y-3.5">
            <View className="flex-row items-start">
              <Text className="text-lg mr-3">🕒</Text>
              <View className="flex-1">
                <Text className="text-sm font-body-semibold text-gray-900">Fill slow hours</Text>
                <Text className="text-xs font-body text-gray-500 mt-0.5">Generate steady orders during off-peak downtime.</Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <Text className="text-lg mr-3">👨‍🍳</Text>
              <View className="flex-1">
                <Text className="text-sm font-body-semibold text-gray-900">No additional employees</Text>
                <Text className="text-xs font-body text-gray-500 mt-0.5">Your existing staff prepares orders effortlessly.</Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <Text className="text-lg mr-3">🍲</Text>
              <View className="flex-1">
                <Text className="text-sm font-body-semibold text-gray-900">Use fresh ingredients</Text>
                <Text className="text-xs font-body text-gray-500 mt-0.5">Utilize ingredients already stocked in your kitchen.</Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <Text className="text-lg mr-3">💵</Text>
              <View className="flex-1">
                <Text className="text-sm font-body-semibold text-gray-900">Create new revenue stream</Text>
                <Text className="text-xs font-body text-gray-500 mt-0.5">Add pure margin without altering core menu offerings.</Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <Text className="text-lg mr-3">📱</Text>
              <View className="flex-1">
                <Text className="text-sm font-body-semibold text-gray-900">Reach new local customers</Text>
                <Text className="text-xs font-body text-gray-500 mt-0.5">Expose your restaurant to active local Diners in the app.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Message Summary Card */}
        <View className="bg-orange-50 rounded-3xl p-5 border border-orange-200 mb-8">
          <View className="flex-row items-center mb-2">
            <Ionicons name="sparkles" size={20} color="#FF6B35" style={{ marginRight: 8 }} />
            <Text className="text-base font-heading-semibold text-orange-950">
              Turn Slow Hours Into Profit
            </Text>
          </View>
          <Text className="text-xs font-body text-orange-900/90 leading-relaxed mb-2">
            {"With DineFive, selling just 30 extra $5.99 meals each day could generate over "}
            <Text className="font-body-bold text-[#FF6B35]">{"$64,000"}</Text>
            {" in additional annual sales—without changing your menu or adding kitchen staff."}
          </Text>
          <Text className="text-[10px] font-body text-orange-800/60 italic">
            Note: These figures represent gross sales revenue. Actual profit depends on your food costs, labor, and other operating expenses.
          </Text>
        </View>

        {/* Primary Dashboard Link CTA Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleOpenDashboard}
          className="bg-[#FF6B35] rounded-2xl py-4 px-6 flex-row items-center justify-center shadow-md mb-3"
        >
          <Text className="text-base font-heading-semibold text-white mr-2">
            Go to Restaurant Owner Dashboard
          </Text>
          <Ionicons name="open-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Secondary Back / Customer Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.replace("/(auth)/login")}
          className="py-3 items-center"
        >
          <Text className="text-sm font-body-semibold text-gray-500">
            Continue to Customer Login
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
