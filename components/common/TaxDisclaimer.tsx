import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Linking, Text, TouchableOpacity, View } from "react-native";

export const STRIPE_TAX_RATES_URL = "https://stripe.com/resources/more/united-states-sales-tax-rates";

interface TaxDisclaimerProps {
  variant?: "card" | "compact" | "banner";
  className?: string;
}

export const openStripeTaxRatesUrl = async () => {
  try {
    const supported = await Linking.canOpenURL(STRIPE_TAX_RATES_URL);
    if (supported) {
      await Linking.openURL(STRIPE_TAX_RATES_URL);
    } else {
      await Linking.openURL(STRIPE_TAX_RATES_URL);
    }
  } catch (err) {
    console.warn("Failed to open tax rates URL:", err);
  }
};

export const TaxDisclaimer: React.FC<TaxDisclaimerProps> = ({
  variant = "card",
  className = "",
}) => {
  if (variant === "compact") {
    return (
      <View className={`flex-row items-start gap-1.5 ${className}`}>
        <Ionicons name="information-circle-outline" size={14} color="#9CA3AF" style={{ marginTop: 1 }} />
        <Text className="text-[11px] text-gray-500 font-body-medium flex-1 leading-tight">
          Taxes are calculated automatically via{" "}
          <Text className="font-body-semibold text-gray-700">Stripe Tax</Text> in compliance with official US statutory rates.{" "}
          <Text
            onPress={openStripeTaxRatesUrl}
            className="text-[#E29E10] font-body-semibold underline"
          >
            View US Tax Rates ↗
          </Text>
        </Text>
      </View>
    );
  }

  if (variant === "banner") {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={openStripeTaxRatesUrl}
        className={`bg-amber-50/70 border border-amber-200/60 rounded-2xl p-3.5 flex-row items-center justify-between ${className}`}
      >
        <View className="flex-row items-center gap-2.5 flex-1 mr-2">
          <View className="w-7 h-7 rounded-lg bg-amber-100 items-center justify-center">
            <Ionicons name="receipt-outline" size={15} color="#D97706" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-body-semibold text-gray-800">
              Official US Statutory Sales Taxes
            </Text>
            <Text className="text-[11px] text-gray-500 font-body-medium">
              Calculated automatically by Stripe Tax. Dine Five does not customize rates.
            </Text>
          </View>
        </View>
        <Ionicons name="open-outline" size={15} color="#D97706" />
      </TouchableOpacity>
    );
  }

  // Default "card" variant
  return (
    <View className={`bg-gray-50/90 border border-gray-200/70 rounded-3xl p-4 ${className}`}>
      <View className="flex-row items-center gap-2 mb-2">
        <View className="w-6 h-6 rounded-full bg-gray-200/80 items-center justify-center">
          <Ionicons name="shield-checkmark" size={13} color="#4B5563" />
        </View>
        <Text className="text-xs font-body-bold text-gray-800">
          Tax Compliance & Statutory Rates
        </Text>
      </View>

      <Text className="text-[11px] text-gray-500 font-body-medium leading-relaxed mb-2.5">
        State and local sales taxes are determined in real-time by{" "}
        <Text className="font-body-semibold text-gray-700">Stripe Tax</Text> based on the restaurant's statutory jurisdiction. Dine Five does not set, customize, or mark up tax rates.
      </Text>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={openStripeTaxRatesUrl}
        className="flex-row items-center self-start gap-1 py-1 px-2.5 bg-white border border-gray-200 rounded-xl shadow-2xs"
      >
        <Text className="text-[11px] font-body-semibold text-amber-700">
          View US Sales Tax Rates & Rules
        </Text>
        <Ionicons name="open-outline" size={12} color="#B45309" />
      </TouchableOpacity>
    </View>
  );
};

export default TaxDisclaimer;
