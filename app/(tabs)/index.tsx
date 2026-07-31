import { Categories } from "@/components/home/Categories";
import { DonateCard } from "@/components/home/DonateCard";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LocationPermissionBanner } from "@/components/home/LocationPermissionBanner";
import { PromoBanner } from "@/components/home/PromoBanner";
import {
  RestaurantSection,
  RestaurantSectionSkeleton,
  SectionErrorBoundary,
} from "@/components/home/RestaurantSection";
import AddressModal from "@/components/home/AddressModal";
import { useStore } from "@/stores/stores";
import { type Restaurant, useRestaurantStore } from "@/stores/useRestaurantStore";
import { getUserAvatarUri } from "@/utils/userAvatar";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// ─── Types ───────────────────────────────────────────────────────────────────

type Banner = {
  title: string;
  image: string;
};

type RestaurantSectionData = {
  title: string;
  items: Restaurant[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map raw API banner shape → { title, image } */
const mapBanner = (b: any): Banner => ({
  title: b?.title ?? "",
  image: b?.bannerImage ?? b?.image ?? "",
});

/** Split a flat restaurant list into up to 3 titled sections */
const buildSections = (list: Restaurant[]): RestaurantSectionData[] => {
  if (!list.length) return [];
  if (list.length <= 4) return [{ title: "Start the Day", items: list }];
  if (list.length <= 8) {
    const mid = Math.ceil(list.length / 2);
    return [
      { title: "Start the Day", items: list.slice(0, mid) },
      { title: "Late Night Cravings", items: list.slice(mid) },
    ].filter((s) => s.items.length > 0);
  }
  const third = Math.ceil(list.length / 3);
  return [
    { title: "Start the Day", items: list.slice(0, third) },
    { title: "Late Night Cravings", items: list.slice(third, third * 2) },
    { title: "Popular Near You", items: list.slice(third * 2) },
  ].filter((s) => s.items.length > 0);
};

/** Extract display name from user object */
const resolveUserName = (user: any): string => {
  if (user?.fullName) return user.fullName;
  if (user?.name) return user.name;
  const parts = [user?.firstName, user?.lastName].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return user?.email ?? "Guest";
};

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const { fetchBanners, fetchProfile, fetchCategories, fetchHomeFeed, user } =
    useStore() as any;

  const {
    location,
    locationLoading,
    locationPermissionGranted,
    restaurants: storeRestaurants,
    restaurantsLoading,
    restaurantsError,
    fetchLocation,
    fetchNearbyRestaurants,
    setLocationManually,
  } = useRestaurantStore();

  // ── State ──
  const [banners, setBanners] = React.useState<Banner[]>([]);
  const [categories, setCategories] = React.useState<string[]>(["All"]);
  const [activeCategory, setActiveCategory] = React.useState("All");
  const [locationLabel, setLocationLabel] = React.useState("");
  const [refreshing, setRefreshing] = React.useState(false);
  const [isAddressModalVisible, setIsAddressModalVisible] = React.useState(false);

  const restaurants = React.useMemo<Restaurant[]>(
    () => (Array.isArray(storeRestaurants) ? storeRestaurants : []),
    [storeRestaurants]
  );

  // ── Derived ──
  const filteredRestaurants = React.useMemo(() => {
    if (activeCategory === "All") return restaurants;
    return restaurants.filter(
      (r) =>
        Array.isArray(r.cuisine) &&
        r.cuisine.some(
          (c) => String(c).toLowerCase() === activeCategory.toLowerCase()
        )
    );
  }, [activeCategory, restaurants]);

  const sections = React.useMemo(
    () => buildSections(filteredRestaurants),
    [filteredRestaurants]
  );

  const userName = React.useMemo(() => resolveUserName(user), [user]);
  const profileImage = React.useMemo(() => getUserAvatarUri(user), [user]);

  const isInitialLoading =
    (locationLoading && !restaurants.length) ||
    (restaurantsLoading && !restaurants.length);

  // ── Data loaders ──
  const loadBanners = React.useCallback(async () => {
    try {
      const payload = await fetchBanners?.();
      // API returns { data: [{ title, bannerImage }] } — already unwrapped by store
      const list: any[] = Array.isArray(payload) ? payload : [];
      setBanners(list.map(mapBanner).filter((b) => b.title || b.image));
    } catch {
      setBanners([]);
    }
  }, [fetchBanners]);

  const loadCategories = React.useCallback(async () => {
    try {
      const data: any[] = await fetchCategories?.() ?? [];
      // API returns [{ categoryName, categoryType, ... }]
      const names = Array.isArray(data)
        ? data.map((c) => c?.categoryName).filter(Boolean)
        : [];
      setCategories(["All", ...names]);
    } catch {
      setCategories(["All"]);
    }
  }, [fetchCategories]);

  const loadNearby = React.useCallback(
    async (
      target: { latitude: number; longitude: number } | null | undefined,
      search = ""
    ) => {
      if (!target) return;
      await fetchNearbyRestaurants({
        latitude: target.latitude,
        longitude: target.longitude,
        radius: 100000,
        limit: 100,
        sortBy: "distance",
        search: search.trim() || undefined,
      });
    },
    [fetchNearbyRestaurants]
  );

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        loadBanners(),
        loadCategories(),
        fetchHomeFeed?.(),
        fetchProfile?.(),
        fetchLocation(),
      ]);
      const loc = useRestaurantStore.getState().location ?? location;
      await loadNearby(loc);
    } finally {
      setRefreshing(false);
    }
  }, [loadBanners, loadCategories, fetchHomeFeed, fetchProfile, fetchLocation, loadNearby, location]);

  // ── Effects ──
  React.useEffect(() => { fetchLocation(); }, [fetchLocation]);

  React.useEffect(() => {
     
    loadBanners();
    loadCategories();
  }, [loadBanners, loadCategories]);

  React.useEffect(() => {
     
    if (params.category) setActiveCategory(String(params.category));
  }, [params.category]);

  // Reverse-geocode location label
  React.useEffect(() => {
    if (!location) return;
    let active = true;
    Location.reverseGeocodeAsync({
      latitude: location.latitude,
      longitude: location.longitude,
    })
      .then((result) => {
        if (!active) return;
        const p = result?.[0];
        const label = p?.district || p?.subregion || p?.city || p?.region || p?.street || "";
        setLocationLabel(label);
      })
      .catch(() => { if (active) setLocationLabel("Current Location"); });
    return () => { active = false; };
  }, [location]);

  // Fetch nearby on location change (debounced)
  React.useEffect(() => {
    const id = setTimeout(() => loadNearby(location), 400);
    return () => clearTimeout(id);
  }, [loadNearby, location]);

  // Reset category if it no longer exists in list
  React.useEffect(() => {
     
    if (!categories.includes(activeCategory)) setActiveCategory("All");
  }, [activeCategory, categories]);

  // ── Handlers ──
  const handleAddressModalConfirm = async (address: string): Promise<boolean> => {
    const res = await setLocationManually(address);
    if (res?.success) {
      setLocationLabel(address);
      return true;
    }
    Alert.alert("Error", res?.error || "Could not resolve address. Please try again.");
    return false;
  };

  const handleLocationPress = () => {
    Alert.alert("Update Location", "Choose how you want to set your address:", [
      { text: "Cancel", style: "cancel" },
      { text: "Use GPS Location", onPress: () => fetchLocation(true) },
      { text: "Enter Address Manually", onPress: () => setIsAddressModalVisible(true) },
    ]);
  };

  const openRestaurantDetail = React.useCallback(
    (restaurant: Restaurant) => {
      router.push({
        pathname: "/screens/home/restaurant-details",
        params: { providerId: restaurant.providerId || restaurant.id },
      });
    },
    [router]
  );

  // ── Render ──
  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />
      <View style={{ paddingTop: insets.top, flex: 1, backgroundColor: "#FFFFFF" }}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#F5C518"
              colors={["#F5C518"]}
            />
          }
        >
          <DonateCard />
          <HomeHeader
            name={userName}
            location={locationLabel || user?.address || user?.city || "Fetching location..."}
            profileImage={profileImage || undefined}
            onLocationPress={handleLocationPress}
          />

          {locationPermissionGranted === false ? (
            <LocationPermissionBanner
              onEnableGPS={() => fetchLocation(true)}
              onManualAddress={() => setIsAddressModalVisible(true)}
            />
          ) : (
            <>
              <PromoBanner banners={banners} />

              <Categories
                activeCategory={activeCategory}
                categories={categories}
                onCategoryChange={setActiveCategory}
              />

              {isInitialLoading && (
                <View style={{ marginTop: 12 }}>
                  <RestaurantSectionSkeleton />
                  <RestaurantSectionSkeleton />
                </View>
              )}

              <SectionErrorBoundary>
                {!isInitialLoading &&
                  sections.map((section) => (
                    <RestaurantSection
                      key={section.title}
                      title={section.title}
                      restaurants={section.items}
                      onOpenRestaurant={openRestaurantDetail}
                    />
                  ))}
              </SectionErrorBoundary>

              {!isInitialLoading && !sections.length && (
                <View className="items-center justify-center py-12 px-6">
                  <View className="w-16 h-16 bg-[#FFFBEB] rounded-full items-center justify-center mb-4">
                    <Ionicons name="restaurant-outline" size={28} color="#F5C518" />
                  </View>
                  <Text className="text-base font-heading text-[#1C1C1C] mb-1">
                    No Restaurants Found
                  </Text>
                  <Text className="text-xs font-body text-gray-400 text-center max-w-[260px] leading-relaxed">
                    We couldn&apos;t find any restaurants near your location. Try adjusting your filters.
                  </Text>
                  {activeCategory !== "All" && (
                    <TouchableOpacity
                      onPress={() => setActiveCategory("All")}
                      className="mt-5 px-5 py-2.5 bg-gray-900 rounded-xl"
                    >
                      <Text className="text-white text-xs font-body-semibold uppercase tracking-wider">
                        Clear Filters
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {!!restaurantsError && (
                <View className="px-4 pb-4">
                  <Text className="text-xs font-body text-amber-700 text-center">
                    {restaurantsError}
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        <AddressModal
          visible={isAddressModalVisible}
          onClose={() => setIsAddressModalVisible(false)}
          onConfirm={handleAddressModalConfirm}
        />
      </View>
    </View>
  );
}
