import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStripe } from "@stripe/stripe-react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRestaurantStore } from "@/stores/useRestaurantStore";

interface TaxBreakdownData {
  mealPrice?: number;
  stateTax?: number;
  stateTaxRate?: number;
  cityTax?: number;
  cityTaxRate?: number;
  platformFee?: number;
  totalTax?: number;
  totalToPay?: number;
  totalAmount?: number;
  providerState?: string;
  providerCity?: string;
}

interface FreeMealTaxCheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  tokenId: string;
  providerId: string;
  foodId: string;
  foodTitle: string;
  restaurantName: string;
  taxBreakdown: TaxBreakdownData | null;
}

export const FreeMealTaxCheckoutModal: React.FC<FreeMealTaxCheckoutModalProps> = ({
  visible,
  onClose,
  tokenId,
  providerId,
  foodId,
  foodTitle,
  restaurantName,
  taxBreakdown,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { createFreeMealPaymentIntent, confirmFreeMealPayment, placeFreeOrder } =
    useRestaurantStore();

  const [isLoading, setIsLoading] = useState(false);

  const formatMoney = (amount?: number) => {
    if (typeof amount !== "number" || isNaN(amount)) return "$0.00";
    return `$${amount.toFixed(2)}`;
  };

  const handlePayTaxAndOrder = async () => {
    if (isLoading) return;
    if (!tokenId || !providerId || !foodId) {
      Alert.alert("Error", "Missing order information. Please try again.");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Create Payment Intent on backend
      const intentRes = await createFreeMealPaymentIntent({
        tokenId,
        providerId,
        foodId,
      });

      if (!intentRes || !intentRes.success) {
        throw new Error(
          intentRes?.message || "Failed to create tax payment intent."
        );
      }

      const {
        clientSecret,
        paymentIntentId,
        requiresStripePayment,
      } = intentRes.data || {};

      const hasClientSecret = Boolean(clientSecret && paymentIntentId);
      const isStripeRequired =
        hasClientSecret &&
        (requiresStripePayment === true ||
          requiresStripePayment === "true" ||
          (taxBreakdown?.totalTax ?? 0) > 0);

      // Case A: Requires Stripe Tax Payment
      if (isStripeRequired && clientSecret && paymentIntentId) {
        // Dismiss the React Native modal so the native Stripe sheet can present cleanly over the window
        onClose();

        // Initialize Stripe Payment Sheet
        const { error: initError } = await initPaymentSheet({
          merchantDisplayName: "Dine Five",
          paymentIntentClientSecret: clientSecret,
          allowsDelayedPaymentMethods: true,
        });

        if (initError) {
          Alert.alert("Payment Error", initError.message || "Failed to initialize payment.");
          setIsLoading(false);
          return;
        }

        // Present Stripe Payment Sheet
        const { error: presentError } = await presentPaymentSheet();
        if (presentError) {
          if (presentError.code === "Canceled") {
            Alert.alert("Cancelled", "Tax payment was cancelled.");
          } else {
            Alert.alert("Payment Failed", presentError.message || "Tax payment failed.");
          }
          setIsLoading(false);
          return;
        }

        // Confirm Payment on Backend
        const confirmRes = await confirmFreeMealPayment(paymentIntentId);
        if (!confirmRes || !confirmRes.success) {
          Alert.alert(
            "Order Error",
            confirmRes?.message ||
              "Tax payment received, but order creation failed. Please contact support."
          );
          setIsLoading(false);
          return;
        }

        const orderId =
          confirmRes.data?.order?.orderId ||
          confirmRes.data?.order?._id ||
          paymentIntentId;

        router.replace({
          pathname: "/screens/cart/order-success",
          params: {
            orderId: String(orderId),
            type: "free-meal",
            mealName: foodTitle,
            restaurantName,
            totalTax: String(taxBreakdown?.totalTax ?? confirmRes.data?.order?.totalPrice ?? 0),
          },
        });
      } else {
        // Case B: No Tax Required or Tax Auto-Waived by Backend
        onClose();
        const orderRes = await placeFreeOrder({
          tokenId,
          providerId,
          foodId,
          quantity: 1,
        });

        if (!orderRes || !orderRes.success) {
          throw new Error(orderRes?.message || "Failed to place free order.");
        }

        const orderId =
          orderRes.data?.orderId ||
          orderRes.data?.order?._id ||
          "FREE-MEAL-ORDER";

        router.replace({
          pathname: "/screens/cart/order-success",
          params: {
            orderId: String(orderId),
            type: "free-meal",
            mealName: foodTitle,
            restaurantName,
            totalTax: String(taxBreakdown?.totalTax ?? 0),
          },
        });
      }
    } catch (err: any) {
      console.error("[FreeMealTaxCheckoutModal] Error:", err);
      Alert.alert(
        "Checkout Error",
        err.message || "An unexpected error occurred during checkout."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const mealPrice = taxBreakdown?.mealPrice ?? 5.99;
  const stateTax = taxBreakdown?.stateTax ?? 0;
  const cityTax = taxBreakdown?.cityTax ?? 0;
  const platformFee = taxBreakdown?.platformFee ?? 0;
  const totalTax = taxBreakdown?.totalTax ?? stateTax + cityTax;
  const totalToPay =
    taxBreakdown?.totalToPay ??
    taxBreakdown?.totalAmount ??
    totalTax + platformFee;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View
          className="bg-white rounded-t-3xl p-6 shadow-2xl"
          style={{ paddingBottom: Math.max(insets.bottom + 24, 36) }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pb-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-[#FFFBEB] justify-center items-center mr-3">
                <Ionicons name="receipt-outline" size={22} color="#D97706" />
              </View>
              <View>
                <Text className="text-lg font-heading text-gray-900">
                  Free Meal Checkout
                </Text>
                <Text className="text-xs font-body text-gray-500">
                  {restaurantName}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={isLoading}
              className="p-2 rounded-full bg-gray-100"
            >
              <Ionicons name="close" size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Item details */}
          <View className="my-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1.5">
            <Text className="text-base font-body-semibold text-gray-900">
              {foodTitle}
            </Text>
            <View className="flex-row justify-between items-center pt-0.5">
              <Text className="text-xs font-body-semibold text-emerald-600">
                🎁 1 Free Donated Meal Token Applied
              </Text>
              <Text className="text-sm font-heading text-emerald-600 line-through">
                {formatMoney(mealPrice)}
              </Text>
            </View>
          </View>

          {/* Tax & Fee Breakdown */}
          <View className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100 space-y-2 mb-6">
            <Text className="text-xs font-body-semibold uppercase tracking-wider text-amber-800 mb-1">
              Cost & Tax Breakdown
            </Text>

            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-body text-gray-600">
                Meal Value
              </Text>
              <Text className="text-sm font-body text-gray-900">
                {formatMoney(mealPrice)} (Free)
              </Text>
            </View>

            {stateTax > 0 && (
              <View className="flex-row justify-between items-center mt-1">
                <Text className="text-sm font-body text-gray-600">
                  State Tax
                  {taxBreakdown?.stateTaxRate && taxBreakdown.stateTaxRate > 0
                    ? ` (${(taxBreakdown.stateTaxRate > 1 ? taxBreakdown.stateTaxRate : taxBreakdown.stateTaxRate * 100).toFixed((taxBreakdown.stateTaxRate * 100) % 1 === 0 ? 0 : 1)}%)`
                    : ""}
                  {taxBreakdown?.providerState ? ` - ${taxBreakdown.providerState}` : ""}
                </Text>
                <Text className="text-sm font-body text-gray-900">
                  {formatMoney(stateTax)}
                </Text>
              </View>
            )}

            {cityTax > 0 && (
              <View className="flex-row justify-between items-center mt-1">
                <Text className="text-sm font-body text-gray-600">
                  City Tax
                  {taxBreakdown?.cityTaxRate && taxBreakdown.cityTaxRate > 0
                    ? ` (${(taxBreakdown.cityTaxRate > 1 ? taxBreakdown.cityTaxRate : taxBreakdown.cityTaxRate * 100).toFixed((taxBreakdown.cityTaxRate * 100) % 1 === 0 ? 0 : 1)}%)`
                    : ""}
                  {taxBreakdown?.providerCity ? ` - ${taxBreakdown.providerCity}` : ""}
                </Text>
                <Text className="text-sm font-body text-gray-900">
                  {formatMoney(cityTax)}
                </Text>
              </View>
            )}

            {platformFee > 0 && (
              <View className="flex-row justify-between items-center mt-1">
                <Text className="text-sm font-body text-gray-600">
                  Platform Fee
                </Text>
                <Text className="text-sm font-body text-gray-900">
                  {formatMoney(platformFee)}
                </Text>
              </View>
            )}

            <View className="border-t border-amber-200/80 pt-2 flex-row justify-between items-center mt-2">
              <Text className="text-base font-heading text-amber-950">
                Total to Pay
              </Text>
              <Text className="text-xl font-heading text-amber-600">
                {totalToPay > 0 && totalToPay < 0.5 ? "$0.00 (Waived)" : formatMoney(totalToPay)}
              </Text>
            </View>

            {totalToPay > 0 && totalToPay < 0.5 && (
              <View className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 mt-2 flex-row items-center gap-2">
                <Ionicons name="sparkles" size={16} color="#059669" />
                <Text className="text-xs font-body-semibold text-emerald-800 flex-1">
                  Amount ({formatMoney(totalToPay)}) is under Stripe's $0.50 minimum and has been waived!
                </Text>
              </View>
            )}
          </View>

          {/* CTA Buttons */}
          <TouchableOpacity
            onPress={handlePayTaxAndOrder}
            disabled={isLoading}
            className={`py-4 rounded-2xl flex-row justify-center items-center shadow-md ${
              isLoading ? "bg-amber-400" : "bg-[#F5C518]"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#000" className="mr-2" />
            ) : (
              <Ionicons name="card-outline" size={20} color="#000" className="mr-2" />
            )}
            <Text className="text-base font-heading text-gray-950">
              {isLoading
                ? "Processing Order..."
                : totalToPay >= 0.5
                ? `Pay ${formatMoney(totalToPay)} & Place Order`
                : totalToPay > 0
                ? "Place Free Order (Tax Waived)"
                : "Place Free Order"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
