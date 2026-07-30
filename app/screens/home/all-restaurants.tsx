import { useStore } from "@/stores/stores";
import { useRestaurantStore } from "@/stores/useRestaurantStore";
import { restaurantService } from "@/stores/restaurantService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";

type Restaurant = any;

const formatDistance = (distanceKm?: any) => {
  const dist = Number(distanceKm);
  if (!Number.isFinite(dist)) return "";
  if (dist < 1) return `${Math.max(1, Math.round(dist * 1000))} m`;
  return `${dist.toFixed(1)} mi`;
};

const getCityAreaLabel = (restaurant: Restaurant): string => {
  const city = restaurant?.city;
  const state = restaurant?.state;
  const address = restaurant?.restaurantAddress;
  if (typeof city === "string" && city.trim()) return city.trim();
  if (typeof state === "string" && state.trim()) return state.trim();
  if (typeof address === "string" && address.trim()) return address.split(",")[0].trim();
  return "Nearby";
};

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function RestaurantSkeleton() {
  const pulse = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);
  return (
    <View style={{ flexDirection: "row", backgroundColor: "#fff", borderRadius: 24, padding: 12, marginBottom: 16, alignItems: "center", borderWidth: 1, borderColor: "#F3F4F6" }}>
      <Animated.View style={{ width: 96, height: 96, borderRadius: 16, backgroundColor: "#E5E7EB", opacity: pulse, marginRight: 16 }} />
      <View style={{ flex: 1, gap: 8 }}>
        <Animated.View style={{ width: 140, height: 16, borderRadius: 6, backgroundColor: "#E5E7EB", opacity: pulse }} />
        <Animated.View style={{ width: 100, height: 12, borderRadius: 4, backgroundColor: "#E5E7EB", opacity: pulse }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Animated.View style={{ width: 44, height: 18, borderRadius: 12, backgroundColor: "#E5E7EB", opacity: pulse }} />
            <Animated.View style={{ width: 44, height: 18, borderRadius: 12, backgroundColor: "#E5E7EB", opacity: pulse }} />
          </View>
          <Animated.View style={{ width: 52, height: 18, borderRadius: 12, backgroundColor: "#E5E7EB", opacity: pulse }} />
        </View>
      </View>
    </View>
  );
}

// ─── Radius options (stable reference) ─────────────────────────────────────────
const RADIUS_OPTIONS = [
  { label: "1 mi", value: 1600 },
  { label: "5 mi", value: 8000 },
  { label: "10 mi", value: 16000 },
  { label: "25 mi", value: 40000 },
  { label: "50 mi", value: 80000 },
];

// ─── Free Meal Card ─────────────────────────────────────────────────────────────
// Used when freeNearYou=true. API returns food items (not restaurants):
// item.image = food photo, item.title/name = food name,
// item.restaurantName = provider, item.originalPrice = original cost, item.category
type FreeMealCardProps = { item: Restaurant; onPress: (r: Restaurant) => void };
const FreeMealCard = React.memo(function FreeMealCard({ item, onPress }: FreeMealCardProps) {
  const foodImage = item.image || item.mealImage || item.imageUrl;
  const restaurantImage = item.profile || item.providerImage || item.restaurantImage;
  const foodName = item.title || item.name || item.mealName || "Free Meal";
  const restaurantName = item.restaurantName || item.providerName || item.providerRestaurantName || "Restaurant";
  const category = item.category || item.categoryName || (Array.isArray(item.cuisine) ? item.cuisine[0] : "");
  const description = String(item.productDescription || item.description || "").trim();
  const distanceLabel = formatDistance(item.distance);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(item)}
      style={{ backgroundColor: "#FFFFFF", borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: "#F3F4F6", elevation: 1, overflow: "hidden" }}
    >
      {/* Food image — full width hero */}
      <View style={{ width: "100%", height: 180, backgroundColor: "#F9FAFB", position: "relative" }}>
        {foodImage
          ? <Image source={{ uri: foodImage }} style={{ width: "100%", height: 180 }} resizeMode="cover" />
          : <View style={{ width: "100%", height: 180, alignItems: "center", justifyContent: "center", backgroundColor: "#FEF3C7" }}>
              <Ionicons name="fast-food-outline" size={48} color="#F5C518" />
            </View>
        }
        {/* FREE badge */}
        <View style={{ position: "absolute", top: 12, left: 12, backgroundColor: "#10B981", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 }}>
          <Text style={{ fontSize: 10, fontFamily: "PlusJakartaSans-Bold", color: "#FFFFFF", textTransform: "uppercase", letterSpacing: 0.5 }}>FREE</Text>
        </View>
        {/* Category pill — top right */}
        {category ? (
          <View style={{ position: "absolute", top: 12, right: 12, backgroundColor: "rgba(0,0,0,0.52)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 12 }}>🍽️</Text>
            <Text style={{ fontSize: 10, fontFamily: "PlusJakartaSans-SemiBold", color: "#FFFFFF" }} numberOfLines={1}>{category}</Text>
          </View>
        ) : null}
      </View>

      {/* Info row */}
      <View style={{ padding: 14 }}>
        <Text style={{ fontSize: 15, fontFamily: "InstrumentSans-SemiBold", color: "#111827", marginBottom: 4 }} numberOfLines={1}>{foodName}</Text>
        {description ? (
          <Text style={{ fontSize: 12, fontFamily: "PlusJakartaSans-Regular", color: "#6B7280", marginBottom: 10, lineHeight: 17 }} numberOfLines={1}>{description}</Text>
        ) : null}

        {/* Restaurant row */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, overflow: "hidden", backgroundColor: "#F3F4F6", marginRight: 8 }}>
              {restaurantImage
                ? <Image source={{ uri: restaurantImage }} style={{ width: 28, height: 28 }} resizeMode="cover" />
                : <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}><Ionicons name="storefront-outline" size={14} color="#9CA3AF" /></View>
              }
            </View>
            <Text style={{ fontSize: 12, fontFamily: "PlusJakartaSans-SemiBold", color: "#4B5563", flex: 1 }} numberOfLines={1}>{restaurantName}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            {distanceLabel ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: "#F9FAFB", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, borderWidth: 1, borderColor: "#F3F4F6" }}>
                <Ionicons name="location-outline" size={11} color="#6B7280" />
                <Text style={{ fontSize: 10, fontFamily: "PlusJakartaSans-Bold", color: "#6B7280" }}>{distanceLabel}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});


// ─── Restaurant Card ────────────────────────────────────────────────────────────
type CardProps = { item: Restaurant; onPress: (r: Restaurant) => void };
const RestaurantCard = React.memo(function RestaurantCard({ item, onPress }: CardProps) {
  const rating = (() => { const r = Number(item.rating); return Number.isFinite(r) ? r.toFixed(1) : "4.2"; })();
  const areaLabel = getCityAreaLabel(item);
  const distanceLabel = formatDistance(item.distance);
  const deliveryMin = item.deliveryTimeMinutes ?? Math.max(5, Math.min(30, Math.round((Number(item.distance) || 0) * 2) + 5));
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(item)}
      style={{ flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 24, padding: 12, marginBottom: 16, alignItems: "center", borderWidth: 1, borderColor: "#F3F4F6", elevation: 1 }}
    >
      <View style={{ width: 96, height: 96, borderRadius: 16, overflow: "hidden", backgroundColor: "#F9FAFB", marginRight: 16 }}>
        {item.profile || item.image
          ? <Image source={{ uri: item.profile || item.image }} style={{ width: 96, height: 96 }} resizeMode="cover" />
          : <View style={{ width: 96, height: 96, alignItems: "center", justifyContent: "center" }}><Ionicons name="restaurant-outline" size={26} color="#9CA3AF" /></View>
        }
      </View>
      <View style={{ flex: 1, paddingVertical: 4, justifyContent: "center" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingRight: 4 }}>
          <Text style={{ fontSize: 14, fontFamily: "InstrumentSans-SemiBold", color: "#111827", flex: 1, marginRight: 8 }} numberOfLines={1}>
            {item.restaurantName || item.name}
          </Text>
          {item.isFreeAvailable && (
            <View style={{ backgroundColor: "#D1FAE5", borderWidth: 1, borderColor: "#A7F3D0", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 }}>
              <Text style={{ fontSize: 9, fontFamily: "PlusJakartaSans-Bold", color: "#065F46", textTransform: "uppercase", letterSpacing: 0.5 }}>Free</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "PlusJakartaSans-SemiBold", marginTop: 2, marginBottom: 8, paddingRight: 8 }} numberOfLines={1}>
          {areaLabel}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FFFBEB", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999, borderWidth: 1, borderColor: "#FDE68A", gap: 4 }}>
              <Ionicons name="star" size={11} color="#F5C518" />
              <Text style={{ fontSize: 10, fontFamily: "PlusJakartaSans-Bold", color: "#92400E" }}>{rating}</Text>
            </View>
            {distanceLabel ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                <Ionicons name="location-outline" size={11} color="#6B7280" />
                <Text style={{ fontSize: 10, fontFamily: "PlusJakartaSans-Bold", color: "#6B7280" }}>{distanceLabel}</Text>
              </View>
            ) : null}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, borderWidth: 1, borderColor: "#F3F4F6" }}>
            <Ionicons name="time-outline" size={10} color="#6B7280" />
            <Text style={{ fontSize: 10, fontFamily: "PlusJakartaSans-Bold", color: "#4B5563", marginLeft: 4 }}>{deliveryMin} min</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Filters Header Component ───────────────────────────────────────────────────
// Defined OUTSIDE screen so its component identity is always stable.
// All styling uses inline `style` — no dynamic className — to avoid NativeWind v4 CSS interop crash.
type FiltersHeaderProps = {
  locationName: string;
  locationLoading: boolean;
  locationSearching: boolean;
  addressSearch: string;
  searchText: string;
  categories: string[];
  activeCategory: string;
  sortBy: "distance" | "rating";
  freeMealsOnly: boolean;
  radiusMeters: number;
  onLocateMe: () => void;
  onAddressChange: (v: string) => void;
  onAddressSearch: () => void;
  onSearchChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onSortByChange: (v: "distance" | "rating") => void;
  onFreeMealsToggle: () => void;
  onRadiusChange: (v: number) => void;
};

const FiltersHeader = React.memo(function FiltersHeader(props: FiltersHeaderProps) {
  const {
    locationName, locationLoading, locationSearching,
    addressSearch, searchText, categories, activeCategory,
    sortBy, freeMealsOnly, radiusMeters,
    onLocateMe, onAddressChange, onAddressSearch, onSearchChange,
    onCategoryChange, onSortByChange, onFreeMealsToggle, onRadiusChange,
  } = props;

  return (
    <View style={{ paddingTop: 16, paddingBottom: 12 }}>
      {/* Location Card */}
      <View style={{ backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A", borderRadius: 24, padding: 16, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
            <Ionicons name="location" size={18} color="#F5C518" />
            <Text style={{ fontSize: 12, fontFamily: "InstrumentSans-SemiBold", color: "#111827", marginLeft: 6, flex: 1 }} numberOfLines={1}>
              {locationName}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onLocateMe}
            disabled={locationLoading || locationSearching}
            style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 }}
          >
            {locationLoading || locationSearching
              ? <ActivityIndicator size="small" color="#1F2937" style={{ marginRight: 4 }} />
              : <Ionicons name="locate" size={14} color="#1F2937" style={{ marginRight: 4 }} />
            }
            <Text style={{ fontSize: 10, fontFamily: "PlusJakartaSans-Bold", color: "#1F2937" }}>Locate Me</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 12 }}>
          <Ionicons name="map-outline" size={16} color="#9CA3AF" />
          <TextInput
            placeholder="Enter city, address or zip code..."
            style={{ flex: 1, marginLeft: 8, color: "#374151", fontSize: 12, paddingVertical: 8 }}
            placeholderTextColor="#9CA3AF"
            value={addressSearch}
            onChangeText={onAddressChange}
            onSubmitEditing={onAddressSearch}
          />
          {addressSearch ? (
            <TouchableOpacity onPress={() => onAddressChange("")} style={{ marginRight: 6 }}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={onAddressSearch}
            disabled={!addressSearch.trim() || locationSearching}
            style={{ backgroundColor: "#111827", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
          >
            <Text style={{ fontSize: 10, fontFamily: "PlusJakartaSans-Bold", color: "#FFFFFF" }}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Restaurant Search */}
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6", paddingHorizontal: 12, marginBottom: 16 }}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          placeholder="Search restaurants, cuisines..."
          style={{ flex: 1, marginLeft: 8, color: "#374151", fontSize: 14, paddingVertical: 10 }}
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={onSearchChange}
        />
        {searchText ? (
          <TouchableOpacity onPress={() => onSearchChange("")} style={{ marginRight: 4 }}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
        {categories.map((item) => {
          const active = activeCategory === item;
          return (
            <TouchableOpacity
              key={item}
              onPress={() => onCategoryChange(item)}
              activeOpacity={0.8}
              style={{ backgroundColor: active ? "#1F2937" : "#F9FAFB", borderColor: active ? "#1F2937" : "#F3F4F6", borderWidth: 1, borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 8 }}
            >
              <Text style={{ fontSize: 12, fontFamily: "PlusJakartaSans-SemiBold", color: active ? "#F5C518" : "#6B7280" }}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sort + Free Meals — ALL inline styles, zero dynamic className */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", backgroundColor: "#F3F4F6", padding: 2, borderRadius: 9999, flex: 1 }}>
          <TouchableOpacity
            onPress={() => onSortByChange("distance")}
            style={{ flex: 1, paddingVertical: 6, borderRadius: 9999, alignItems: "center", backgroundColor: sortBy === "distance" ? "#FFFFFF" : "transparent", elevation: sortBy === "distance" ? 1 : 0 }}
          >
            <Text style={{ fontSize: 10, fontFamily: "PlusJakartaSans-SemiBold", color: "#374151" }}>Distance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSortByChange("rating")}
            style={{ flex: 1, paddingVertical: 6, borderRadius: 9999, alignItems: "center", backgroundColor: sortBy === "rating" ? "#FFFFFF" : "transparent", elevation: sortBy === "rating" ? 1 : 0 }}
          >
            <Text style={{ fontSize: 10, fontFamily: "PlusJakartaSans-SemiBold", color: "#374151" }}>Rating</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={onFreeMealsToggle}
          activeOpacity={0.8}
          style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, borderWidth: 1, backgroundColor: freeMealsOnly ? "#ECFDF5" : "#F9FAFB", borderColor: freeMealsOnly ? "#A7F3D0" : "#F3F4F6" }}
        >
          <Ionicons name={freeMealsOnly ? "checkbox" : "square-outline"} size={14} color={freeMealsOnly ? "#10B981" : "#9CA3AF"} />
          <Text style={{ fontSize: 10, fontFamily: "PlusJakartaSans-Bold", marginLeft: 6, color: freeMealsOnly ? "#065F46" : "#4B5563" }}>Free Meals Only</Text>
        </TouchableOpacity>
      </View>

      {/* Radius — ALL inline styles */}
      <View style={{ marginBottom: 8 }}>
        <Text style={{ fontSize: 10, fontFamily: "PlusJakartaSans-SemiBold", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, marginLeft: 4 }}>Distance Radius</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {RADIUS_OPTIONS.map((rad) => {
            const active = radiusMeters === rad.value;
            return (
              <TouchableOpacity
                key={rad.label}
                onPress={() => onRadiusChange(rad.value)}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, borderWidth: 1, backgroundColor: active ? "#FEF3C7" : "#F9FAFB", borderColor: active ? "#FCD34D" : "#F3F4F6" }}
              >
                <Text style={{ fontSize: 10, fontFamily: "PlusJakartaSans-SemiBold", color: active ? "#92400E" : "#6B7280" }}>{rad.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
});

// ─── Empty State Component ──────────────────────────────────────────────────────
type EmptyProps = { loading: boolean; error: string | null; searchText: string; activeCategory: string; freeMealsOnly: boolean; radiusMeters: number; onRetry: () => void; onClear: () => void };
const ListEmpty = React.memo(function ListEmpty({ loading, error, searchText, activeCategory, freeMealsOnly, radiusMeters, onRetry, onClear }: EmptyProps) {
  if (loading) return null;
  const hasFilters = searchText || activeCategory !== "All" || freeMealsOnly || radiusMeters !== 16000;
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 64, paddingHorizontal: 24 }}>
      <View style={{ width: 64, height: 64, backgroundColor: "#FFFBEB", borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Ionicons name="restaurant-outline" size={28} color="#F5C518" />
      </View>
      <Text style={{ fontSize: 16, fontFamily: "InstrumentSans-SemiBold", color: "#1C1C1C", marginBottom: 4 }}>No Restaurants Found</Text>
      <Text style={{ fontSize: 12, fontFamily: "PlusJakartaSans-Regular", color: "#9CA3AF", textAlign: "center", maxWidth: 260, lineHeight: 18 }}>
        {error ?? "We couldn't find any restaurants matching your filters or location."}
      </Text>
      {error ? (
        <TouchableOpacity onPress={onRetry} style={{ marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#111827", borderRadius: 10 }}>
          <Text style={{ fontSize: 12, fontFamily: "PlusJakartaSans-Bold", color: "#FFFFFF", textTransform: "uppercase", letterSpacing: 0.5 }}>Retry</Text>
        </TouchableOpacity>
      ) : hasFilters ? (
        <TouchableOpacity onPress={onClear} style={{ marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#111827", borderRadius: 10 }}>
          <Text style={{ fontSize: 12, fontFamily: "PlusJakartaSans-Bold", color: "#FFFFFF", textTransform: "uppercase", letterSpacing: 0.5 }}>Clear Filters</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

// ─── Footer Skeleton ─────────────────────────────────────────────────────────────
// ─── Free Meal Skeleton ────────────────────────────────────────────────────────
function FreeMealSkeleton() {
  const pulse = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.85, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View style={{ backgroundColor: "#FFFFFF", borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: "#F3F4F6", overflow: "hidden" }}>
      {/* Hero image placeholder */}
      <Animated.View style={{ width: "100%", height: 180, backgroundColor: "#E5E7EB", opacity: pulse }} />
      {/* Info block */}
      <View style={{ padding: 14, gap: 10 }}>
        {/* Title */}
        <Animated.View style={{ width: "60%", height: 16, borderRadius: 8, backgroundColor: "#E5E7EB", opacity: pulse }} />
        {/* Description */}
        <Animated.View style={{ width: "90%", height: 12, borderRadius: 6, backgroundColor: "#E5E7EB", opacity: pulse }} />
        {/* Restaurant row */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Animated.View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#E5E7EB", opacity: pulse }} />
            <Animated.View style={{ width: 100, height: 12, borderRadius: 6, backgroundColor: "#E5E7EB", opacity: pulse }} />
          </View>
          <Animated.View style={{ width: 56, height: 24, borderRadius: 9999, backgroundColor: "#E5E7EB", opacity: pulse }} />
        </View>
      </View>
    </View>
  );
}

const ListFooter = React.memo(function ListFooter({ loading, freeMealsOnly }: { loading: boolean; freeMealsOnly: boolean }) {
  if (!loading) return null;
  if (freeMealsOnly) {
    return (
      <View style={{ paddingTop: 8 }}>
        <FreeMealSkeleton />
        <FreeMealSkeleton />
        <FreeMealSkeleton />
      </View>
    );
  }
  return (
    <View style={{ paddingTop: 8 }}>
      <RestaurantSkeleton />
      <RestaurantSkeleton />
      <RestaurantSkeleton />
      <RestaurantSkeleton />
      <RestaurantSkeleton />
    </View>
  );
});

// ─── Main Screen ─────────────────────────────────────────────────────────────────
export default function AllRestaurantsScreen() {
  const router = useRouter();
  const { location, fetchLocation, setLocationManually, locationLoading } = useRestaurantStore();
  const fetchCategories = useStore((state: any) => state.fetchCategories);

  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"distance" | "rating">("distance");
  const [radiusMeters, setRadiusMeters] = useState(16000);
  const [freeMealsOnly, setFreeMealsOnly] = useState(false);

  const [locationName, setLocationName] = useState("Detecting location...");
  const [addressSearch, setAddressSearch] = useState("");
  const [locationSearching, setLocationSearching] = useState(false);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);

  // Reverse geocode
  useEffect(() => {
    if (!location) { setLocationName("Unknown Location"); return; }
    Location.reverseGeocodeAsync({ latitude: location.latitude, longitude: location.longitude })
      .then((r) => {
        if (r?.length > 0) {
          const a = r[0];
          const name = [a.street || a.name, a.city || a.subregion, a.region].filter(Boolean).join(", ");
          setLocationName(name || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
        } else {
          setLocationName(`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
        }
      })
      .catch(() => setLocationName(`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`));
  }, [location]);

  const handleLocationSearch = useCallback(async () => {
    if (!addressSearch.trim()) return;
    setLocationSearching(true);
    try {
      const result = await setLocationManually(addressSearch);
      if (result.success) setAddressSearch("");
      else Alert.alert("Location Not Found", "Could not find coordinates for this address.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to search location.");
    } finally {
      setLocationSearching(false);
    }
  }, [addressSearch, setLocationManually]);

  const fetchCategoriesData = useCallback(async () => {
    try {
      const result = await fetchCategories?.();
      setDynamicCategories(result || []);
    } catch { /* ignore */ }
  }, [fetchCategories]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    if (Array.isArray(dynamicCategories)) dynamicCategories.forEach((c: any) => { if (c?.categoryName) s.add(c.categoryName); });
    if (Array.isArray(restaurants)) restaurants.forEach((r) => { if (Array.isArray(r?.cuisine)) r.cuisine.forEach((c: any) => { if (c) s.add(String(c)); }); });
    return ["All", ...Array.from(s)];
  }, [dynamicCategories, restaurants]);

  const loadRestaurants = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    setError(null);
    try {
      const response = await restaurantService.getNearby({
        latitude: location?.latitude ?? 40.7128,
        longitude: location?.longitude ?? -74.006,
        radius: radiusMeters,
        sortBy,
        freeNearYou: freeMealsOnly,
        cuisine: activeCategory === "All" ? undefined : activeCategory,
        search: searchText.trim() || undefined,
        limit: 100,
      });
      if (response.success) setRestaurants(response.data ?? []);
      else setError(response.message || "Failed to load restaurants.");
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [location, radiusMeters, sortBy, freeMealsOnly, activeCategory, searchText]);

  useEffect(() => { fetchLocation(); fetchCategoriesData(); }, [fetchLocation, fetchCategoriesData]);

  useEffect(() => {
    if (!categories.includes(activeCategory)) setActiveCategory("All");
  }, [activeCategory, categories]);

  useEffect(() => {
    const id = setTimeout(() => loadRestaurants(), 400);
    return () => clearTimeout(id);
  }, [loadRestaurants]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLocation();
    loadRestaurants(true);
  }, [fetchLocation, loadRestaurants]);

  const handleOpenRestaurant = useCallback((restaurant: Restaurant) => {
    if (restaurant.isFreeAvailable) {
      // Free meal item — go to product-details (same flow as location.tsx map tab)
      router.push({
        pathname: "/screens/home/product-details",
        params: {
          id: restaurant.foodId || restaurant.id,
          foodId: restaurant.foodId || restaurant.id,
          name: restaurant.mealName || restaurant.title || restaurant.restaurantName || "",
          price: String(restaurant.price ?? 0),
          image: restaurant.mealImage || restaurant.image || restaurant.profile || "",
          description: restaurant.productDescription || "",
          restaurantName: restaurant.restaurantName || "",
          restaurantProfile: restaurant.profile || "",
          isFreeAvailable: "true",
          freeTokenCount: String(restaurant.freeTokenCount || 0),
          providerId: restaurant.providerId || restaurant.id,
        },
      });
    } else {
      // Regular restaurant — go to restaurant-details
      router.push({
        pathname: "/screens/home/restaurant-details",
        params: {
          providerId: restaurant.providerId || restaurant.id,
          isFreeAvailable: "false",
          freeTokenCount: String(restaurant.freeTokenCount || 0),
          name: restaurant.restaurantName || restaurant.name || "",
          image: restaurant.profile || restaurant.image || "",
          rating: restaurant.rating != null ? String(restaurant.rating) : "",
          address: restaurant.restaurantAddress || "",
          distance: restaurant.distance || "",
        },
      });
    }
  }, [router]);

  const handleLocateMe = useCallback(async () => {
    setLocationSearching(true);
    await fetchLocation(true);
    setLocationSearching(false);
  }, [fetchLocation]);

  const handleFreeMealsToggle = useCallback(() => setFreeMealsOnly((p) => !p), []);
  const handleClearFilters = useCallback(() => {
    setSearchText(""); setActiveCategory("All"); setSortBy("distance"); setRadiusMeters(16000); setFreeMealsOnly(false);
  }, []);
  const handleRetry = useCallback(() => loadRestaurants(), [loadRestaurants]);

  const renderItem = useCallback(({ item }: { item: Restaurant }) => (
    freeMealsOnly
      ? <FreeMealCard item={item} onPress={handleOpenRestaurant} />
      : <RestaurantCard item={item} onPress={handleOpenRestaurant} />
  ), [freeMealsOnly, handleOpenRestaurant]);

  // Header props object — changes when filter state changes, triggers FiltersHeader re-render (not remount)
  const headerProps: FiltersHeaderProps = useMemo(() => ({
    locationName,
    locationLoading,
    locationSearching,
    addressSearch,
    searchText,
    categories,
    activeCategory,
    sortBy,
    freeMealsOnly,
    radiusMeters,
    onLocateMe: handleLocateMe,
    onAddressChange: setAddressSearch,
    onAddressSearch: handleLocationSearch,
    onSearchChange: setSearchText,
    onCategoryChange: setActiveCategory,
    onSortByChange: setSortBy,
    onFreeMealsToggle: handleFreeMealsToggle,
    onRadiusChange: setRadiusMeters,
  }), [locationName, locationLoading, locationSearching, addressSearch, searchText, categories, activeCategory, sortBy, freeMealsOnly, radiusMeters, handleLocateMe, handleLocationSearch, handleFreeMealsToggle]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#F9FAFB" }}>
        <TouchableOpacity
          onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); }}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="chevron-back" size={20} color="#1F2937" />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontFamily: "InstrumentSans-SemiBold", color: "#111827" }}>All Restaurants</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        key={freeMealsOnly ? "free-meals-list" : "restaurants-list"}
        data={restaurants}
        extraData={freeMealsOnly}
        keyExtractor={(item, index) =>
          freeMealsOnly
            ? `food-${item.foodId || item.id || item.providerId || index}-${index}`
            : `res-${item.providerId || item.id || index}-${index}`
        }
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#F5C518"]} />}
        ListHeaderComponent={<FiltersHeader {...headerProps} />}
        ListEmptyComponent={
          <ListEmpty
            loading={loading}
            error={error}
            searchText={searchText}
            activeCategory={activeCategory}
            freeMealsOnly={freeMealsOnly}
            radiusMeters={radiusMeters}
            onRetry={handleRetry}
            onClear={handleClearFilters}
          />
        }
        ListFooterComponent={<ListFooter loading={loading} freeMealsOnly={freeMealsOnly} />}
      />
    </SafeAreaView>
  );
}
