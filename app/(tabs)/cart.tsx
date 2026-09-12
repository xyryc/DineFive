import { EmptyState } from "@/components/common/EmptyState";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useStore } from "@/stores/stores";
import { requireAuth } from "@/utils/authGuard";
import { deriveMealTaxRatePercents } from "@/utils/restaurantTax";
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
  // Only the specific item(s) with a mutation in flight go into this set —
  // other items' controls stay fully interactive while one is updating.
  const [pendingItemIds, setPendingItemIds] = React.useState<Set<string>>(
    new Set(),
  );
  const anyPending = pendingItemIds.size > 0;
  // Serializes the actual network calls so two quick taps on different items
  // never race each other writing to the same cart on the server, even
  // though the UI itself updates optimistically and instantly for each tap.
  const mutationQueueRef = React.useRef<Promise<any>>(Promise.resolve());
  // Debounce timers per item — rapid +/- taps collapse into a single request
  // for the final quantity, instead of one slow request per tap.
  const debounceTimersRef = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  // The quantity actually in flight (debouncing or being sent) per item,
  // independent of React's render timing — lets rapid taps stack correctly
  // even before a re-render has shown the previous tap's result.
  const latestQuantityRef = React.useRef<Map<string, number>>(new Map());
  const [cartMeta, setCartMeta] = React.useState<any>(null);
  const [includeUtensils, setIncludeUtensils] = React.useState(true);

  // Derive subtotal dynamically from cartItems so totals update in 0ms on +/- taps
  const subtotal = React.useMemo(() => {
    return cartItems.reduce(
      (acc: number, item: any) =>
        acc + toNumber(item.price, 0) * (Number(item.quantity) || 0),
      0,
    );
  }, [cartItems]);

  // Parses a raw cart API response (from either GET /cart or the
  // add/update/remove mutation responses, which return the same shape) into
  // the groups/items this screen renders. Shared so a mutation's own
  // response can update the screen directly, without a second GET /cart
  // round-trip right after it.
  const applyCartPayload = React.useCallback((cartData: any) => {
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
            taxBreakdown: group.taxBreakdown,
            platformFee: toNumber(group.platformFee, 0),
            // Rate shown next to State Tax / City Tax must be the exact percentage
            // Stripe applied to the meal line, never a tax ÷ subtotal guess (that
            // overstates the rate because the tax total also includes tax on the
            // platform fee line). null means "unknown" — the label omits the % then.
            ...deriveMealTaxRatePercents(group.taxBreakdown),
            total: totalVal,
            items: formattedGroupItems,
          };
        });
        setCartGroups(formattedGroups);
        const allFlatItems = formattedGroups.reduce(
          (acc: any[], g: any) => [...acc, ...g.items],
          [],
        );
        setCartItems(allFlatItems);
      } else {
        setCartItems([]);
        setCartGroups([]);
        setCartMeta(null);
      }
    },
    [],
  );

  const loadCart = React.useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      const cartData = await fetchCart();
      applyCartPayload(cartData);
      if (showLoading) setLoading(false);
    },
    [fetchCart, applyCartPayload],
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

  // Sends the actual mutation to the server for the final debounced
  // quantity, queued behind any other item's in-flight mutation so writes
  // to the same cart never race each other.
  const flushQuantityUpdate = React.useCallback(
    (foodId: string, cartItemId: string, quantity: number) => {
      mutationQueueRef.current = mutationQueueRef.current
        .then(async () => {
          const result =
            quantity <= 0
              ? await removeCartItem(foodId)
              : await updateCartQuantity(foodId, quantity);
          const payload =
            result?.data?.cart ?? result?.data ?? result?.cart ?? result;
          applyCartPayload(payload);
        })
        .catch((error) => {
          console.log("Error updating cart item:", error);
          // The optimistic guess may now be wrong — resync with the server.
          return loadCart(false);
        })
        .finally(() => {
          latestQuantityRef.current.delete(cartItemId);
          setPendingItemIds((prev) => {
            const next = new Set(prev);
            next.delete(cartItemId);
            return next;
          });
        });
    },
    [removeCartItem, updateCartQuantity, applyCartPayload, loadCart],
  );

  const handleUpdateQuantity = (
    foodId: string,
    cartItemId: string,
    delta: number,
    currentQuantity: number,
  ) => {
    if (!foodId) return;

    // Stack off the last tap in this burst (tracked in a ref, so it's
    // correct even if React hasn't re-rendered the previous tap yet),
    // falling back to the item's known quantity for the first tap.
    const baseline = latestQuantityRef.current.has(cartItemId)
      ? latestQuantityRef.current.get(cartItemId)!
      : currentQuantity;
    const newQuantity = Math.max(0, baseline + delta);
    latestQuantityRef.current.set(cartItemId, newQuantity);

    // ── Optimistic update: reflect the new quantity instantly on every
    //    tap, don't wait on the network for the thing just tapped ──────
    setCartItems((prev) =>
      newQuantity <= 0
        ? prev.filter((it) => it.cartItemId !== cartItemId)
        : prev.map((it) =>
            it.cartItemId === cartItemId ? { ...it, quantity: newQuantity } : it,
          ),
    );
    setCartGroups((prev) =>
      prev
        .map((g) => ({
          ...g,
          items:
            newQuantity <= 0
              ? g.items.filter((it: any) => it.cartItemId !== cartItemId)
              : g.items.map((it: any) =>
                  it.cartItemId === cartItemId
                    ? { ...it, quantity: newQuantity }
                    : it,
                ),
        }))
        .filter((g) => g.items.length > 0),
    );

    // ── Only this item shows as pending — every other item, and the rest
    //    of the cart, stays fully interactive while this resolves ───────
    setPendingItemIds((prev) => new Set(prev).add(cartItemId));

    // ── Debounce: reset the timer on every tap in the same burst, and
    //    only actually hit the server ~400ms after the last tap, sending
    //    just the final quantity instead of one request per tap ────────
    const timers = debounceTimersRef.current;
    const existingTimer = timers.get(cartItemId);
    if (existingTimer) clearTimeout(existingTimer);
    timers.set(
      cartItemId,
      setTimeout(() => {
        timers.delete(cartItemId);
        flushQuantityUpdate(foodId, cartItemId, newQuantity);
      }, 400),
    );
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
  const taxSubtotal = stateTaxAmount + cityTax + countyTaxAmount;
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
        {cartGroups.map((group, groupIdx) => {
          // Only this restaurant's aggregate numbers (tax/fee/total) go stale
          // while one of its own items is mid-update — other restaurants'
          // cards, and every item's own controls elsewhere, stay untouched.
          const groupPending = group.items.some((it: any) =>
            pendingItemIds.has(it.cartItemId),
          );
          return (
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
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      activeOpacity={0.6}
                      className="w-8 h-8 rounded-xl bg-white border border-gray-100 items-center justify-center shadow-xs"
                    >
                      <Ionicons name="remove" size={14} color="#1F2937" />
                    </TouchableOpacity>

                    <Text className="text-sm font-body-bold text-gray-800 min-w-[20px] text-center">
                      {item.quantity}
                    </Text>

                    <TouchableOpacity
                      onPress={() =>
                        handleUpdateQuantity(
                          item.foodId,
                          item.cartItemId,
                          1,
                          item.quantity,
                        )
                      }
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      activeOpacity={0.6}
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
                  Food Item
                </Text>
                {groupPending ? (
                  <View className="w-12 h-3.5 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <Text className="text-xs font-body-semibold text-gray-600">
                    {formatMoney(group.subtotal)}
                  </Text>
                )}
              </View>

              {group.platformFee > 0 && (
                <View className="flex-row justify-between items-center">
                  <Text className="text-[11px] text-gray-400 font-body-semibold">
                    Platform Fee
                  </Text>
                  {groupPending ? (
                    <View className="w-10 h-3.5 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <Text className="text-xs font-body-semibold text-gray-600">
                      {formatMoney(group.platformFee)}
                    </Text>
                  )}
                </View>
              )}

              <View className="flex-row justify-between items-center">
                <Text className="text-[11px] text-gray-400 font-body-semibold">
                  State Tax
                  {typeof group.statePercent === "number"
                    ? ` (${group.statePercent.toFixed(2)}%)`
                    : ""}
                </Text>
                {groupPending ? (
                  <View className="w-10 h-3.5 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <Text className="text-xs font-body-semibold text-gray-600">
                    {formatMoney(group.stateTax)}
                  </Text>
                )}
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-[11px] text-gray-400 font-body-semibold">
                  City Tax
                  {typeof group.cityPercent === "number"
                    ? ` (${group.cityPercent.toFixed(2)}%)`
                    : ""}
                </Text>
                {groupPending ? (
                  <View className="w-10 h-3.5 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <Text className="text-xs font-body-semibold text-gray-600">
                    {formatMoney(group.cityTax)}
                  </Text>
                )}
              </View>

              <View className="flex-row justify-between items-center pt-1.5 mt-1 border-t border-gray-100/50">
                <Text className="text-[12px] font-body-bold text-gray-800">
                  Total for this restaurant
                </Text>
                {groupPending ? (
                  <View className="w-14 h-4 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <Text className="text-sm font-heading text-gray-900">
                    {formatMoney(group.total)}
                  </Text>
                )}
              </View>
            </View>
          </View>
          );
        })}

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
                Platform fee subtotal
              </Text>
              {loading ? (
                <View className="bg-gray-100 h-5 w-16 rounded animate-pulse" />
              ) : (
                <Text className="text-sm font-body-semibold text-gray-800">
                  {formatMoney(platformFee)}
                </Text>
              )}
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-body-medium text-gray-500">
                Tax subtotal
              </Text>
              {loading ? (
                <View className="bg-gray-100 h-5 w-16 rounded animate-pulse" />
              ) : (
                <Text className="text-sm font-body-semibold text-gray-800">
                  {formatMoney(taxSubtotal)}
                </Text>
              )}
            </View>

            {/* Per-restaurant jurisdiction breakdown (state vs. city rate) stays on the cards above */}

            <View className="flex-row justify-between items-center pt-3 mt-1 border-t border-gray-50">
              <Text className="text-base font-heading text-gray-900">
                Total Amount
              </Text>
              {loading || anyPending ? (
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
            disabled={anyPending}
            style={{ opacity: anyPending ? 0.5 : 1 }}
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

          {anyPending ? (
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
            disabled={anyPending}
            style={{ opacity: anyPending ? 0.6 : 1 }}
            className="flex-1 h-12 rounded-2xl border border-gray-200 bg-white items-center justify-center flex-row"
          >
            <Ionicons name="add" size={18} color="#1F2937" />
            <Text className="text-sm font-body-semibold text-gray-800 ml-1">
              Add More
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (!requireAuth("proceed to checkout")) return;
              router.push("/screens/cart/checkout");
            }}
            activeOpacity={0.8}
            disabled={anyPending}
            style={{ opacity: anyPending ? 0.6 : 1 }}
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
