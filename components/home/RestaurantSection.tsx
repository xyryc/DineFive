import React from "react";
import { Animated, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { type Restaurant } from "@/stores/useRestaurantStore";
import { normalizeImageUri } from "@/utils/userAvatar";
import { useRouter } from "expo-router";

const formatDistance = (distanceKm?: number | string) => {
  const dist = Number(distanceKm);
  if (!Number.isFinite(dist)) return "";
  if (dist < 1) return `${Math.max(1, Math.round(dist * 1000))} m`;
  return `${dist.toFixed(1)} mi`;
};

const getCityAreaLabel = (restaurant: Restaurant): string => {
  const city = restaurant.city || (restaurant as any).city;
  const state = restaurant.state || (restaurant as any).state;
  const address = restaurant.restaurantAddress || (restaurant as any).address;

  if (typeof city === "string" && city.trim()) return city.trim();
  if (typeof state === "string" && state.trim()) return state.trim();
  if (typeof address === "string" && address.trim()) {
    // Pick first segment before comma if full address
    return address.split(",")[0].trim();
  }
  return "Nearby";
};

// ── Error Boundaries ──
type EBState = { hasError: boolean };

class CardErrorBoundary extends React.Component<{ children: React.ReactNode }, EBState> {
  state: EBState = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    console.error("[CardErrorBoundary] Caught render error:", error, info);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export class SectionErrorBoundary extends React.Component<{ children: React.ReactNode }, EBState> {
  state: EBState = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    console.error("[SectionErrorBoundary] Caught render error:", error, info);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ── Card Component ──
function SectionRestaurantCardInner({
  restaurant,
  onOpen,
}: {
  restaurant: Restaurant;
  onOpen: () => void;
}) {
  if (!restaurant) return null;

  const distanceLabel = formatDistance(restaurant.distance);
  const rawRating = Number((restaurant as any).rating);
  const rating = Number.isFinite(rawRating) && rawRating > 0 ? rawRating.toFixed(1) : "4.2";
  const areaLabel = getCityAreaLabel(restaurant);
  const rawDelivery = Number((restaurant as any).etaMinutes ?? (restaurant as any).deliveryTimeMinutes);
  const deliveryMin = Number.isFinite(rawDelivery) && rawDelivery > 0
    ? rawDelivery
    : Math.max(5, Math.min(30, Math.round((Number(restaurant.distance) || 0) * 2) + 5));

  const rawUri =
    (restaurant as any).foodImage ||
    (restaurant as any).image ||
    restaurant.profile ||
    "";
  const profileUri = normalizeImageUri(rawUri);

  const name =
    restaurant.restaurantName ||
    (restaurant as any).name ||
    restaurant.title ||
    "Restaurant";

  const availableFoods = Number(restaurant.availableFoods ?? (restaurant as any).foodCount ?? 0);

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onOpen}
      style={{
        width: 224,
        marginRight: 16,
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 6,
        borderWidth: 1,
        borderColor: "#F9FAFB",
      }}
    >
      <View
        style={{
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "#F9FAFB",
          marginBottom: 14,
          position: "relative",
          height: 160,
        }}
      >
        {profileUri ? (
          <Image
            source={{ uri: profileUri }}
            style={{ width: "100%", height: 160 }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#F3F4F6",
            }}
          >
            <Ionicons name="restaurant-outline" size={32} color="#D1D5DB" />
          </View>
        )}
        <View
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            backgroundColor: "#F5C518",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
          }}
        >
          <Text className="text-[10px] font-body-semibold text-[#111827]">
            {availableFoods > 0 ? `${availableFoods} items` : "Open"}
          </Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 4, paddingBottom: 4 }}>
        <Text className="text-sm font-heading text-[#111827]" numberOfLines={1}>
          {name}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, flexWrap: "wrap", gap: 4 }}>
          <Ionicons name="star" size={11} color="#F5C518" />
          <Text className="text-[11px] font-body-semibold text-[#374151]">{rating}</Text>
          <Text style={{ fontSize: 10, color: "#D1D5DB" }}>•</Text>
          <Text className="text-[11px] font-body text-[#6B7280] flex-1" numberOfLines={1}>
            {areaLabel}
          </Text>
          <Text className="text-[11px] font-body-medium text-[#6B7280]">{deliveryMin}min</Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
          <Ionicons name="location-sharp" size={10} color="#9CA3AF" />
          <Text className="text-[10px] font-body text-[#9CA3AF] ml-0.5" numberOfLines={1}>
            {distanceLabel || "Nearby"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function SectionRestaurantCard({ restaurant, onOpen }: { restaurant: Restaurant; onOpen: () => void }) {
  return (
    <CardErrorBoundary>
      <SectionRestaurantCardInner restaurant={restaurant} onOpen={onOpen} />
    </CardErrorBoundary>
  );
}

// ── Section Wrapper Component ──
export function RestaurantSection({
  title,
  restaurants,
  onOpenRestaurant,
}: {
  title: string;
  restaurants: Restaurant[];
  onOpenRestaurant: (restaurant: Restaurant) => void;
}) {
  const router = useRouter();
  if (!Array.isArray(restaurants) || restaurants.length === 0) return null;

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 8 }}>
        <Text className="text-lg font-heading text-[#111827] flex-1 mr-2" numberOfLines={1}>
          {title}
        </Text>
        <TouchableOpacity onPress={() => router.push("/screens/home/all-restaurants")} style={{ flexShrink: 0 }}>
          <Text className="text-sm font-body-semibold text-[#F5C518]">View all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {restaurants.filter(Boolean).map((restaurant, index) => {
          const key = String(restaurant?.id || (restaurant as any)?.providerId || index);
          return (
            <SectionRestaurantCard
              key={key}
              restaurant={restaurant}
              onOpen={() => onOpenRestaurant(restaurant)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── Skeletons ──
export function RestaurantCardSkeleton() {
  const [pulseAnim] = React.useState(() => new Animated.Value(0.3));

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={{ width: 224, marginRight: 16, backgroundColor: "#fff", borderRadius: 10, padding: 6, borderWidth: 1, borderColor: "#F3F4F6" }}>
      <Animated.View style={{ width: "100%", height: 160, borderRadius: 12, backgroundColor: "#E5E7EB", opacity: pulseAnim, marginBottom: 14 }} />
      <View style={{ paddingHorizontal: 4, paddingBottom: 4, gap: 6 }}>
        <Animated.View style={{ width: 140, height: 14, borderRadius: 4, backgroundColor: "#E5E7EB", opacity: pulseAnim }} />
        <Animated.View style={{ width: 180, height: 10, borderRadius: 4, backgroundColor: "#E5E7EB", opacity: pulseAnim }} />
        <Animated.View style={{ width: 100, height: 10, borderRadius: 4, backgroundColor: "#E5E7EB", opacity: pulseAnim }} />
      </View>
    </View>
  );
}

export function RestaurantSectionSkeleton() {
  const [pulseAnim] = React.useState(() => new Animated.Value(0.3));

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 12 }}>
        <Animated.View style={{ width: 130, height: 18, borderRadius: 6, backgroundColor: "#E5E7EB", opacity: pulseAnim }} />
        <Animated.View style={{ width: 50, height: 14, borderRadius: 4, backgroundColor: "#E5E7EB", opacity: pulseAnim }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
        <RestaurantCardSkeleton />
        <RestaurantCardSkeleton />
        <RestaurantCardSkeleton />
      </ScrollView>
    </View>
  );
}
