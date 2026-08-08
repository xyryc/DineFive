import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import {
  Restaurant,
  useRestaurantStore,
} from "../../stores/useRestaurantStore";

import AddressModal from "./AddressModal";
import MapMarkerItem from "./MapMarkerItem";
import MapSearchBar from "./MapSearchBar";
import MealFilterBar from "./MealFilterBar";
import RestaurantCard from "./RestaurantCard";
import SkeletonCard from "./SkeletonCard";
import {
  buildRestaurantSearchHaystack,
  CARD_GAP,
  CARD_SNAP_INTERVAL,
  formatRadius,
  getRestaurantCoords,
  normalizeRestaurantSearchQuery,
} from "./utils/mapHelpers";

type MealFilter = "all" | "free";

type RestaurantMapViewProps = {
  onOpenRestaurant?: (restaurant: Restaurant) => void;
};

export default function RestaurantMapView({
  onOpenRestaurant,
}: RestaurantMapViewProps) {
  const mapRef = useRef<MapView>(null);
  const flatListRef = useRef<FlatList<Restaurant>>(null);
  const hasAutoZoomed = useRef(false);

  const {
    location,
    locationLoading,
    locationPermissionGranted,
    restaurants,
    restaurantsLoading,
    restaurantsError,
    selectedRestaurant,
    cuisineFilter,
    radiusMeters,
    fetchLocation,
    fetchNearbyRestaurants,
    fetchFreeMeals,
    setSelectedRestaurant,
    setActiveFeedMode,
    setRadiusMeters,
    setLocationManually,
  } = useRestaurantStore();

  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [mealFilter, setMealFilter] = useState<MealFilter>("all");
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [addressLabel, setAddressLabel] = useState("3067 Fifth Ave");

  const userLat = location?.latitude ?? 23.780704;
  const userLng = location?.longitude ?? 90.407756;
  const hasLocation = !!location && !locationLoading;

  // Reverse-geocode address label whenever location changes
  useEffect(() => {
    if (!location) return;
    let active = true;
    Location.reverseGeocodeAsync({
      latitude: location.latitude,
      longitude: location.longitude,
    })
      .then((result) => {
        if (!active) return;
        const place = result?.[0];
        if (place) {
          setAddressLabel(
            place.street ||
              place.district ||
              place.subregion ||
              place.city ||
              place.name ||
              "Current Location",
          );
        }
      })
      .catch(() => {
        if (active) setAddressLabel("Current Location");
      });
    return () => {
      active = false;
    };
  }, [location]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchText(searchText), 500);
    return () => clearTimeout(handler);
  }, [searchText]);

  // Debug logs for Google Maps API Key & Environment
  useEffect(() => {
    const expoPublicMapKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

    console.log("🗺️ [RestaurantMapView] Initialized on Platform:", Platform.OS);
    console.log("🗺️ [RestaurantMapView] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY:", expoPublicMapKey
      ? `Found (${expoPublicMapKey.substring(0, 6)}...${expoPublicMapKey.slice(-4)}) [len: ${expoPublicMapKey.length}]`
      : "❌ UNDEFINED/MISSING"
    );
    console.log("🗺️ [RestaurantMapView] Map Provider:", PROVIDER_GOOGLE);
  }, []);

  // Fetch location on mount
  useEffect(() => {
    console.log("🗺️ [RestaurantMapView] Fetching user location...");
    fetchLocation();
  }, [fetchLocation]);

  // Auto-zoom map once on first location
  useEffect(() => {
    if (
      location &&
      !locationLoading &&
      !hasAutoZoomed.current &&
      mapRef.current
    ) {
      const latitudeDelta = 0.003;
      const longitudeDelta = 0.003;
      // Shift map camera south by latitudeDelta * 0.25 so pins sit in upper region above cards
      const latitudeOffset = latitudeDelta * 0.25;
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude - latitudeOffset,
          longitude: location.longitude,
          latitudeDelta,
          longitudeDelta,
        },
        1000,
      );
      hasAutoZoomed.current = true;
    }
  }, [location, locationLoading]);

  // Fetch restaurants when relevant deps change
  useEffect(() => {
    if (!hasLocation) return;
    if (mealFilter === "free") {
      fetchFreeMeals({
        page: 1,
        limit: 20,
        search: debouncedSearchText || undefined,
      });
      return;
    }
    fetchNearbyRestaurants({
      latitude: userLat,
      longitude: userLng,
      radius: radiusMeters,
      cuisine: cuisineFilter,
      sortBy: "distance",
      page: 1,
      limit: 20,
      search: debouncedSearchText || undefined,
      freeNearYou: false,
    });
  }, [
    mealFilter,
    hasLocation,
    userLat,
    userLng,
    radiusMeters,
    cuisineFilter,
    debouncedSearchText,
    fetchFreeMeals,
    fetchNearbyRestaurants,
  ]);

  const allRestaurants = useMemo(
    () => (Array.isArray(restaurants) ? restaurants : []),
    [restaurants],
  );

  const filteredRestaurants = useMemo(() => {
    const query = normalizeRestaurantSearchQuery(debouncedSearchText);
    if (!query) return allRestaurants;
    const tokens = query.split(" ").filter(Boolean);
    return allRestaurants.filter((r) => {
      const hay = buildRestaurantSearchHaystack(r);
      return tokens.every((t) => hay.includes(t));
    });
  }, [allRestaurants, debouncedSearchText]);

  // Sync carousel index with selected restaurant
  useEffect(() => {
    if (filteredRestaurants.length === 0) {
      requestAnimationFrame(() => {
        setSelectedRestaurant(null);
        setActiveCardIndex(0);
      });
      return;
    }
    if (!selectedRestaurant) {
      requestAnimationFrame(() => {
        setSelectedRestaurant(filteredRestaurants[0]);
        setActiveCardIndex(0);
      });
      return;
    }
    const idx = filteredRestaurants.findIndex(
      (r) => r.id === selectedRestaurant.id,
    );
    if (idx === -1) {
      setSelectedRestaurant(filteredRestaurants[0]);

      setActiveCardIndex(0);
      try {
        flatListRef.current?.scrollToIndex({ index: 0, animated: true });
      } catch {}
      return;
    }
    if (idx !== activeCardIndex) {
      setActiveCardIndex(idx);
      try {
        flatListRef.current?.scrollToIndex({ index: idx, animated: true });
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredRestaurants, selectedRestaurant?.id]);

  // Pan map to selected restaurant
  useEffect(() => {
    if (!selectedRestaurant || !mapRef.current) return;
    const coords = getRestaurantCoords(selectedRestaurant);
    if (!coords) return;
    const latitudeDelta = 0.003;
    const longitudeDelta = 0.003;
    // Shift camera south so selected restaurant pin sits in upper portion of map above cards
    const latitudeOffset = latitudeDelta * 0.25;
    mapRef.current.animateToRegion(
      {
        latitude: coords.latitude - latitudeOffset,
        longitude: coords.longitude,
        latitudeDelta,
        longitudeDelta,
      } as Region,
      450,
    );
  }, [selectedRestaurant]);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleAutoLocate = async () => {
    await fetchLocation(true);
    const { location: loc } = useRestaurantStore.getState();
    if (loc && mapRef.current) {
      const latitudeDelta = 0.003;
      const longitudeDelta = 0.003;
      const latitudeOffset = latitudeDelta * 0.25;
      mapRef.current.animateToRegion(
        {
          latitude: loc.latitude - latitudeOffset,
          longitude: loc.longitude,
          latitudeDelta,
          longitudeDelta,
        },
        1000,
      );
    }
  };

  const handleMarkerPress = (restaurant: Restaurant) => {
    const index = filteredRestaurants.findIndex((r) => r.id === restaurant.id);
    setSelectedRestaurant(restaurant);
    if (index !== -1) {
      setActiveCardIndex(index);
      try {
        flatListRef.current?.scrollToIndex({ index, animated: true });
      } catch {}
    }
  };

  const handleCardSnap = (event: any) => {
    if (!filteredRestaurants.length) return;
    const x = event.nativeEvent.contentOffset?.x ?? 0;
    const idx = Math.max(
      0,
      Math.min(
        Math.round(x / CARD_SNAP_INTERVAL),
        filteredRestaurants.length - 1,
      ),
    );
    const restaurant = filteredRestaurants[idx];
    if (!restaurant) return;
    setActiveCardIndex(idx);
    if (selectedRestaurant?.id !== restaurant.id)
      setSelectedRestaurant(restaurant);
  };

  const openRestaurantDetail = (restaurant: Restaurant) => {
    const isFreeMode = mealFilter === "free";
    onOpenRestaurant?.({
      ...restaurant,
      isFreeAvailable: isFreeMode ? true : restaurant.isFreeAvailable,
      freeTokenCount: isFreeMode
        ? restaurant.freeTokenCount || 1
        : restaurant.freeTokenCount,
    });
  };

  const handleRadiusPress = (radius: number) => {
    if (radius !== radiusMeters) {
      setRadiusMeters(radius);
      setSelectedRestaurant(null);
    }
  };

  const handleAddressModalConfirm = async (
    address: string,
  ): Promise<boolean> => {
    const res = await setLocationManually(address);
    if (res?.success) {
      setAddressLabel(address);
      if (res.location && mapRef.current) {
        const latitudeDelta = 0.003;
        const longitudeDelta = 0.003;
        const latitudeOffset = latitudeDelta * 0.25;
        mapRef.current.animateToRegion(
          {
            latitude: res.location.latitude - latitudeOffset,
            longitude: res.location.longitude,
            latitudeDelta,
            longitudeDelta,
          },
          1000,
        );
      }
      return true;
    }
    Alert.alert(
      "Error",
      res?.error || "Could not resolve address. Please try again.",
    );
    return false;
  };

  const switchToAll = () => {
    if (mealFilter === "all") return;
    setMealFilter("all");
    setActiveFeedMode("all");
    setActiveCardIndex(0);
    setSelectedRestaurant(null);
    useRestaurantStore.setState({
      restaurants: [],
      restaurantsError: null,
      availableTokenCount: 0,
    });
    if (!hasLocation) return;
    fetchNearbyRestaurants({
      latitude: userLat,
      longitude: userLng,
      radius: radiusMeters,
      cuisine: cuisineFilter,
      sortBy: "distance",
      page: 1,
      limit: 20,
      freeNearYou: false,
    });
  };

  const switchToFree = async () => {
    if (mealFilter === "free") return;
    setMealFilter("free");
    setActiveFeedMode("free");
    setActiveCardIndex(0);
    setSelectedRestaurant(null);
    useRestaurantStore.setState({
      restaurants: [],
      restaurantsError: null,
      availableTokenCount: 0,
    });
    if (!hasLocation) return;
    await fetchFreeMeals({ page: 1, limit: 20 });
  };

  // ─── Guard screens ───────────────────────────────────────────────────────

  if (locationPermissionGranted === false) {
    return (
      <View className="flex-1 items-center justify-center bg-[#FDFBF7] px-8 gap-y-5">
        <View className="w-20 h-20 bg-amber-50 border border-amber-100 rounded-full items-center justify-center shadow-sm">
          <Ionicons name="location-outline" size={40} color="#E29E10" />
        </View>
        <View className="items-center px-4">
          <Text className="text-lg font-heading text-gray-900 text-center">
            Location Access Required
          </Text>
          <Text className="text-sm text-gray-400 font-body-semibold text-center mt-1.5 leading-relaxed">
            Dine Five uses your location to show nearby food options and
            restaurants on the map.
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleAutoLocate}
          className="bg-[#E29E10] h-12 w-full rounded-2xl flex-row items-center justify-center gap-2 shadow-sm"
        >
          <Ionicons name="pin" size={16} color="#FFF" />
          <Text className="text-white font-body-bold text-sm">
            Enable Location Access
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (locationLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <StatusBar style="dark" />
        <View className="w-16 h-16 rounded-3xl bg-[#F5C518]/10 items-center justify-center mb-4">
          <Ionicons name="location-outline" size={32} color="#F5C518" />
        </View>
        <ActivityIndicator size="small" color="#F5C518" />
        <Text className="text-gray-500 mt-3 font-body-semibold text-sm">
          Locating restaurants on map...
        </Text>
      </View>
    );
  }

  if (restaurantsError && restaurants.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-[#FDFBF7] px-8">
        <Ionicons name="wifi-outline" size={48} color="#D1D5DB" />
        <Text className="mt-4 text-gray-500 text-center text-sm">
          {restaurantsError}
        </Text>
        <TouchableOpacity
          onPress={() =>
            mealFilter === "free"
              ? fetchFreeMeals({ page: 1, limit: 20 })
              : fetchNearbyRestaurants({
                  latitude: userLat,
                  longitude: userLng,
                  radius: radiusMeters,
                  cuisine: cuisineFilter,
                  sortBy: "distance",
                  page: 1,
                  limit: 20,
                })
          }
          className="mt-6 bg-[#FFC107] px-8 py-3 rounded-full shadow-sm"
        >
          <Text className="font-body-bold text-gray-900">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Main map ────────────────────────────────────────────────────────────

  return (
    <View
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: "#F3F4F6",
      }}
    >
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        style={{ flex: 1, width: "100%", height: "100%" }}
        mapPadding={{ top: 0, right: 0, bottom: 100, left: 0 }}
        initialRegion={{
          latitude: userLat - 0.003 * 0.25,
          longitude: userLng,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        onPress={() => setSelectedRestaurant(null)}
        onMapReady={() => console.log("🗺️ [RestaurantMapView] Map is READY (onMapReady fired successfully)")}
        onMapLoaded={() => console.log("🗺️ [RestaurantMapView] Map tiles LOADED (onMapLoaded fired)")}
        onLayout={(e) => console.log("🗺️ [RestaurantMapView] Map layout dimensions:", e.nativeEvent.layout)}
      >
        {/* User location dot */}
        {hasLocation && (
          <Marker
            coordinate={{ latitude: userLat, longitude: userLng }}
            title="My Location"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View className="w-6 h-6 items-center justify-center">
              <View className="absolute w-5 h-5 bg-blue-500/20 rounded-full border border-blue-500/30" />
              <View className="w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
            </View>
          </Marker>
        )}

        {/* Restaurant markers */}
        {filteredRestaurants.map((restaurant) => (
          <MapMarkerItem
            key={restaurant.id}
            restaurant={restaurant}
            isSelected={selectedRestaurant?.id === restaurant.id}
            onPress={() => handleMarkerPress(restaurant)}
          />
        ))}
      </MapView>

      {/* Top overlay: search + radius */}
      <MapSearchBar
        searchText={searchText}
        onSearchChange={setSearchText}
        addressLabel={addressLabel}
        radiusMeters={radiusMeters}
        onAutoLocate={handleAutoLocate}
        onPickerPress={() => setIsAddressModalVisible(true)}
        onRadiusPress={handleRadiusPress}
      />

      {/* Results count badge */}
      <View className="absolute top-[100px] left-4 bg-white px-3 py-1.5 rounded-full shadow-md border border-gray-100">
        {restaurantsLoading ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator size="small" color="#FFC107" />
            <Text className="text-xs text-gray-500">Searching...</Text>
          </View>
        ) : (
          <Text className="text-xs font-body-semibold text-gray-700">
            {`${filteredRestaurants.length} found within ${formatRadius(radiusMeters)}`}
          </Text>
        )}
      </View>

      {/* Bottom overlay: filter toggles + card carousel */}
      <View className="absolute bottom-36 left-0 right-0">
        <MealFilterBar
          mealFilter={mealFilter}
          onSelectAll={switchToAll}
          onSelectFree={switchToFree}
        />

        {restaurantsLoading ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, gap: CARD_GAP }}
          >
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </ScrollView>
        ) : filteredRestaurants.length === 0 ? (
          <View className="mx-4 bg-white/95 rounded-2xl px-4 py-3 shadow-md">
            <Text className="text-sm text-gray-500 text-center">
              No restaurants found in this area.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredRestaurants}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_SNAP_INTERVAL}
            decelerationRate="fast"
            snapToAlignment="start"
            initialScrollIndex={0}
            onMomentumScrollEnd={handleCardSnap}
            contentContainerStyle={{
              paddingLeft: 12,
              paddingRight: 12,
              gap: CARD_GAP,
            }}
            getItemLayout={(_, index) => ({
              length: CARD_SNAP_INTERVAL,
              offset: CARD_SNAP_INTERVAL * index + 12,
              index,
            })}
            renderItem={({ item, index }) => (
              <RestaurantCard
                item={item}
                index={index}
                activeCardIndex={activeCardIndex}
                selectedRestaurantId={selectedRestaurant?.id}
                isFreeMode={mealFilter === "free"}
                onPress={() => openRestaurantDetail(item)}
              />
            )}
          />
        )}
      </View>

      {/* Location picker modal */}
      <AddressModal
        visible={isAddressModalVisible}
        onClose={() => setIsAddressModalVisible(false)}
        onConfirm={handleAddressModalConfirm}
      />
    </View>
  );
}
