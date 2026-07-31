import { EmptyState } from "@/components/common/EmptyState";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useStore } from "@/stores/stores";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const pickString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const formatMoney = (value: unknown) => {
  const num = toNumber(value, 0);
  return `$${num.toFixed(2)}`;
};

export default function CartScreen() {
  const router = useRouter();
  const { fetchCart, updateCartQuantity, removeCartItem, clearCart } =
    useStore() as any;
  const insets = useSafeAreaInsets();
  const [cartItems, setCartItems] = React.useState<any[]>([]);
  const [cartGroups, setCartGroups] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [syncingItemId, setSyncingItemId] = React.useState<string | null>(null);
  const [cartMeta, setCartMeta] = React.useState<any>(null);
  const [includeUtensils, setIncludeUtensils] = React.useState(true);

  // Derive subtotal dynamically from cartItems so totals update in 0ms on +/- taps
  const subtotal = React.useMemo(() => {
    return cartItems.reduce(
      (acc: number, item: any) => acc + (toNumber(item.price, 0) * (Number(item.quantity) || 0)),
      0,
    );
  }, [cartItems]);

  const loadCart = React.useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      const cartData = await fetchCart();
      const root = cartData?.items
        ? cartData
        : cartData?.data?.items
          ? cartData.data
          : null;
      const rawItems = Array.isArray(root?.items) ? root.items : [];
      const rawGroups = Array.isArray(root?.restaurantGroups)
        ? root.restaurantGroups
        : [];

      if (root && (rawItems.length || rawGroups.length)) {
        setCartMeta(root);

        // Format groups
        const formattedGroups = rawGroups.map((group: any) => {
          const groupItems = Array.isArray(group.items) ? group.items : [];
          const formattedGroupItems = groupItems.map((item: any) => {
            const foodData =
              item?.foodId && typeof item.foodId === "object"
                ? item.foodId
                : item?.food && typeof item.food === "object"
                  ? item.food
                  : null;

            const resolvedFoodId = pickString(
              foodData?._id,
              foodData?.id,
              item?.foodId,
              item?.food?.foodId,
              item?.food?.id,
              item?._id,
            );

            return {
              id: pickString(
                foodData?._id,
                foodData?.id,
                item._id,
                resolvedFoodId,
              ),
              cartItemId: pickString(item._id, resolvedFoodId),
              name: pickString(
                foodData?.title,
                foodData?.name,
                item.title,
                item.name,
                "Unknown item",
              ),
              price: toNumber(
                item.baseRevenue ??
                  foodData?.baseRevenue ??
                  item.price ??
                  foodData?.price ??
                  foodData?.finalPriceTag,
                0,
              ),
              image: pickString(foodData?.image, item.image),
              quantity: Math.max(1, Math.floor(toNumber(item.quantity, 1))),
              foodId: resolvedFoodId,
              providerId: pickString(
                group.providerId,
                item.providerId,
                foodData?.providerId,
                foodData?.providerID,
              ),
              providerProfile: pickString(
                group.restaurantProfile,
                group.restaurantImage,
                item.providerProfile,
                foodData?.providerProfile,
              ),
              providerName: pickString(
                group.restaurantName,
                item.providerName,
                foodData?.providerName,
              ),
              restaurantName: pickString(
                group.restaurantName,
                root?.restaurantName,
                item.restaurantName,
                item.providerRestaurantName,
                foodData?.restaurantName,
                foodData?.providerRestaurantName,
                foodData?.providerName,
                item.providerName,
              ),
              restaurantAddress: pickString(
                group.restaurantAddress,
                root?.restaurantAddress,
                item.restaurantAddress,
                foodData?.restaurantAddress,
                item.address,
              ),
              distanceKm: toNumber(
                item.distanceKm ?? foodData?.distanceKm,
                NaN,
              ),
              etaMinutes: toNumber(
                item.etaMinutes ?? foodData?.etaMinutes,
                NaN,
              ),
              serviceFee: toNumber(item.serviceFee ?? foodData?.serviceFee, 0),
            };
          });

          const subtotalVal = toNumber(group.subtotal, 0);
          const stateTaxVal = toNumber(
            group.stateTax ?? group.stateTaxAmount,
            0,
          );
          const cityTaxVal = toNumber(group.cityTax, 0);
          const totalVal = toNumber(
            group.total,
            subtotalVal + stateTaxVal + cityTaxVal,
          );

          return {
            providerId: group.providerId,
            restaurantName: pickString(group.restaurantName, "Restaurant"),
            restaurantAddress: pickString(
              group.restaurantAddress,
              "Address unavailable",
            ),
            restaurantProfile: pickString(
              group.restaurantProfile,
              group.restaurantImage,
              "",
            ),
            subtotal: subtotalVal,
            stateTax: stateTaxVal,
            cityTax: cityTaxVal,
            total: totalVal,
            items: formattedGroupItems,
          };
        });
        setCartGroups(formattedGroups);
        const allFlatItems = formattedGroups.reduce((acc: any[], g: any) => [...acc, ...g.items], []);
        setCartItems(allFlatItems);
      } else {
        setCartItems([]);
        setCartGroups([]);
        setCartMeta(null);
      }
      if (showLoading) setLoading(false);
    },
    [fetchCart],
  );

  React.useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Removed geocoding / tax rules loading block

  useFocusEffect(
    React.useCallback(() => {
      loadCart(false);
    }, [loadCart]),
  );

  const handleUpdateQuantity = async (
    foodId: string,
    cartItemId: string,
    delta: number,
    currentQuantity: number,
  ) => {
    if (!foodId || isSyncing) return;
    const newQuantity = Math.max(0, currentQuantity + delta);

    // ── Activate text skeletons on numbers ──────────────────────────
    setIsSyncing(true);
    setSyncingItemId(cartItemId);

    try {
      // ── API call to update backend cart ──────────────────────────
      if (newQuantity <= 0) {
        await removeCartItem(foodId);
      } else {
        await updateCartQuantity(foodId, newQuantity);
      }

      // ── Fetch fresh server calculations & item breakdown ───────
      await loadCart(false);
    } catch (error) {
      console.log("Error updating cart item:", error);
      await loadCart(false);
    } finally {
      // ── Deactivate text skeletons to reveal updated numbers ─────
      setIsSyncing(false);
      setSyncingItemId(null);
    }
  };

  if (loading && cartItems.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <StatusBar style="dark" />
        <View className="w-16 h-16 rounded-3xl bg-[#F5C518]/10 items-center justify-center mb-4">
          <Ionicons name="fast-food-outline" size={32} color="#F5C518" />
        </View>
        <ActivityIndicator size="small" color="#F5C518" />
        <Text className="text-gray-500 mt-3 font-body-semibold text-sm">
          Loading Cart...
        </Text>
      </SafeAreaView>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#FDFBF7]">
        <StatusBar style="dark" />
        <EmptyState
          icon="basket-outline"
          title="Your cart is empty!"
          message="Explore and add items to the cart to show here..."
          buttonText="Explore"
          onButtonPress={() => router.push("/(tabs)")}
        />
      </SafeAreaView>
    );
  }

  const platformFee = toNumber(cartMeta?.platformFee, 0);
  const cityTax = toNumber(cartMeta?.cityTax, 0);
  const stateTaxAmount = toNumber(
    cartMeta?.stateTaxAmount ?? cartMeta?.stateTax,
    0,
  );
  const countyTaxAmount = toNumber(cartMeta?.countyTaxAmount, 0);
  const total = toNumber(
    cartMeta?.total,
    subtotal + platformFee + cityTax + stateTaxAmount + countyTaxAmount,
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FBF9F6]" edges={["top"]}>
      <StatusBar style="dark" />

      {/* Header */}
      <ScreenHeader title="My Cart" icon="cart-outline" showBack={false} />

      <ScrollView
        className="flex-1 px-4 mt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 230 }}
      >
        {/* Restaurant Groups */}
        {cartGroups.map((group, groupIdx) => (
          <View
            key={group.providerId || groupIdx}
            className="bg-white rounded-3xl border border-gray-100/80 overflow-hidden shadow-sm mb-6"
          >
            {/* Restaurant Header */}
            <View className="p-4 flex-row items-center bg-gray-50/50 border-b border-gray-100/50">
              <View className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100/80 mr-3 justify-center items-center">
                {group.restaurantProfile ? (
                  <Image
                    source={{ uri: group.restaurantProfile }}
                    className="w-12 h-12"
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="restaurant" size={20} color="#9CA3AF" />
                )}
              </View>
              <View className="flex-1">
                <Text
                  className="text-base font-heading text-gray-900"
                  numberOfLines={1}
                >
                  {group.restaurantName}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                  <Text
                    className="text-[11px] text-gray-400 ml-1 font-body-medium flex-1"
                    numberOfLines={1}
                  >
                    {group.restaurantAddress}
                  </Text>
                </View>
              </View>
            </View>

            {/* Group Items list */}
            <View>
              {group.items.map((item: any, itemIdx: number) => (
                <View
                  key={item.cartItemId || item.id}
                  className={`flex-row items-center p-4 ${
                    itemIdx < group.items.length - 1
                      ? "border-b border-gray-50"
                      : ""
                  }`}
                >
                  {/* Item Image */}
                  <View className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 mr-3 justify-center items-center">
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        className="w-16 h-16"
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons
                        name="fast-food-outline"
                        size={24}
                        color="#9CA3AF"
                      />
                    )}
                  </View>

                  {/* Item Details */}
                  <View className="flex-1 justify-center mr-2">
                    <Text
                      className="text-sm font-body-semibold text-gray-900"
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                    <Text className="text-sm font-body-semibold text-[#E29E10] mt-1">
                      {formatMoney(toNumber(item.price, 0))}
                    </Text>
                  </View>

                  {/* Quantity Selector */}
                  <View className="flex-row items-center bg-gray-50 border border-gray-100/50 rounded-2xl p-1 gap-x-2">
                    <TouchableOpacity
                      onPress={() =>
                        handleUpdateQuantity(
                          item.foodId,
                          item.cartItemId,
                          -1,
                          item.quantity,
                        )
                      }
                      disabled={isSyncing}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      activeOpacity={0.6}
                      style={{ opacity: isSyncing ? 0.4 : 1 }}
                      className="w-8 h-8 rounded-xl bg-white border border-gray-100 items-center justify-center shadow-xs"
                    >
                      <Ionicons name="remove" size={14} color="#1F2937" />
                    </TouchableOpacity>

                    {isSyncing && syncingItemId === item.cartItemId ? (
                      <View className="w-5 h-4 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      <Text className="text-sm font-body-bold text-gray-800 min-w-[20px] text-center">
                        {item.quantity}
                      </Text>
                    )}

                    <TouchableOpacity
                      onPress={() =>
                        handleUpdateQuantity(
                          item.foodId,
                          item.cartItemId,
                          1,
                          item.quantity,
                        )
                      }
                      disabled={isSyncing}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      activeOpacity={0.6}
                      style={{ opacity: isSyncing ? 0.4 : 1 }}
                      className="w-8 h-8 rounded-xl bg-white border border-gray-100 items-center justify-center shadow-xs"
                    >
                      <Ionicons name="add" size={14} color="#1F2937" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Group Price Breakdown Footer */}
            <View className="px-4 py-3 bg-gray-50/10 border-t border-gray-100/50 gap-y-1.5">
              <View className="flex-row justify-between items-center">
                <Text className="text-[11px] text-gray-400 font-body-semibold">
                  Subtotal
                </Text>
                {isSyncing ? (
                  <View className="w-12 h-3.5 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <Text className="text-xs font-body-semibold text-gray-600">
                    {formatMoney(group.subtotal)}
                  </Text>
                )}
              </View>

              {group.stateTax > 0 && (
                <View className="flex-row justify-between items-center">
                  <Text className="text-[11px] text-gray-400 font-body-semibold">
                    State Tax
                  </Text>
                  {isSyncing ? (
                    <View className="w-10 h-3.5 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <Text className="text-xs font-body-semibold text-gray-600">
                      {formatMoney(group.stateTax)}
                    </Text>
                  )}
                </View>
              )}

              {group.cityTax > 0 && (
                <View className="flex-row justify-between items-center">
                  <Text className="text-[11px] text-gray-400 font-body-semibold">
                    City Tax
                  </Text>
                  {isSyncing ? (
                    <View className="w-10 h-3.5 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <Text className="text-xs font-body-semibold text-gray-600">
                      {formatMoney(group.cityTax)}
                    </Text>
                  )}
                </View>
              )}

              <View className="flex-row justify-between items-center pt-1.5 mt-1 border-t border-gray-100/50">
                <Text className="text-[12px] font-body-bold text-gray-800">
                  Total for this restaurant
                </Text>
                {isSyncing ? (
                  <View className="w-14 h-4 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <Text className="text-sm font-heading text-gray-900">
                    {formatMoney(group.total)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ))}

        {/* Utensils Option Card */}
        <View className="bg-white rounded-3xl border border-gray-100/80 p-4 shadow-sm flex-row items-center justify-between mb-4">
          <View className="flex-row items-center flex-1 mr-3">
            <View className="w-10 h-10 bg-[#FFF8E7] rounded-2xl items-center justify-center mr-3 border border-[#FFE8B5]">
              <Ionicons name="restaurant-outline" size={18} color="#E29E10" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-body-semibold text-gray-800">
                Include utensils
              </Text>
              <Text className="text-xs text-gray-400 font-body-medium mt-0.5">
                Napkins, forks, straws, etc.
              </Text>
            </View>
          </View>
          <Switch
            value={includeUtensils}
            onValueChange={setIncludeUtensils}
            trackColor={{ false: "#E5E7EB", true: "#E29E10" }}
            thumbColor="#fff"
          />
        </View>

        {/* Price Breakdown Card */}
        <View className="bg-white rounded-3xl border border-gray-100/80 p-5 shadow-sm">
          <Text className="text-[11px] font-body-semibold text-gray-400 uppercase tracking-widest mb-3 ml-0.5">
            Bill Details
          </Text>

          <View className="gap-y-2.5">
            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-body-medium text-gray-500">
                Item subtotal
              </Text>
              {loading ? (
                <View className="bg-gray-100 h-5 w-16 rounded animate-pulse" />
              ) : (
                <Text className="text-sm font-body-semibold text-gray-800">
                  {formatMoney(subtotal)}
                </Text>
              )}
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-body-medium text-gray-500">
                Platform fee
              </Text>
              {loading ? (
                <View className="bg-gray-100 h-5 w-16 rounded animate-pulse" />
              ) : (
                <Text className="text-sm font-body-semibold text-gray-800">
                  {formatMoney(platformFee)}
                </Text>
              )}
            </View>

            {/* Taxes are itemized per restaurant card above */}

            <View className="flex-row justify-between items-center pt-3 mt-1 border-t border-gray-50">
              <Text className="text-base font-heading text-gray-900">
                Total Amount
              </Text>
              {loading || isSyncing ? (
                <View className="bg-gray-200 h-5 w-16 rounded animate-pulse" />
              ) : (
                <Text className="text-base font-heading text-gray-900">
                  {formatMoney(total)}
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom action bar */}
      <View
        className="absolute left-4 right-4 bg-white border border-gray-100/50 rounded-3xl p-4 shadow-xl"
        style={{
          bottom: insets.bottom > 0 ? insets.bottom + 72 : 75,
          zIndex: 10,
          elevation: 10,
        }}
      >
        <View className="flex-row items-center justify-between mb-3.5 px-1">
          <TouchableOpacity
            className="flex-row items-center"
            activeOpacity={0.7}
            disabled={isSyncing}
            style={{ opacity: isSyncing ? 0.5 : 1 }}
            onPress={async () => {
              await clearCart?.();
              await loadCart(false);
            }}
          >
            <Ionicons name="trash-outline" size={14} color="#EF4444" />
            <Text className="text-[12px] font-body-semibold text-red-500 ml-1">
              Clear Cart
            </Text>
          </TouchableOpacity>

          {isSyncing ? (
            <View className="bg-gray-200 h-5 w-20 rounded animate-pulse" />
          ) : (
            <Text className="text-base font-heading text-gray-900">
              Total: {formatMoney(total)}
            </Text>
          )}
        </View>

        <View className="flex-row gap-x-3">
          <TouchableOpacity
            onPress={() => router.push("/(tabs)")}
            activeOpacity={0.8}
            disabled={isSyncing}
            style={{ opacity: isSyncing ? 0.6 : 1 }}
            className="flex-1 h-12 rounded-2xl border border-gray-200 bg-white items-center justify-center flex-row"
          >
            <Ionicons name="add" size={18} color="#1F2937" />
            <Text className="text-sm font-body-semibold text-gray-800 ml-1">
              Add More
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/screens/cart/checkout")}
            activeOpacity={0.8}
            disabled={isSyncing}
            style={{ opacity: isSyncing ? 0.6 : 1 }}
            className="flex-1 h-12 rounded-2xl overflow-hidden"
          >
            <LinearGradient
              colors={["#F5C518", "#E29E10"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                height: "100%",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
              }}
            >
              <Text className="text-sm font-body-semibold text-white">
                Checkout
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color="#ffffff"
                style={{ marginLeft: 4 }}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
