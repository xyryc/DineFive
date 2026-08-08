import RestaurantMapView from '@/components/map/RestaurantMapView';
import { Restaurant } from '@/services/restaurantService';
import { useRestaurantStore } from '@/stores/useRestaurantStore';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LocationScreen() {
  const { setRadiusMeters } = useRestaurantStore();

  useEffect(() => {
    const expoPublicMapKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

    console.log("📍 [LocationScreen] Mounted on Platform:", Platform.OS);
    console.log("📍 [LocationScreen] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY:", expoPublicMapKey
      ? `Loaded (${expoPublicMapKey.substring(0, 6)}...${expoPublicMapKey.slice(-4)}) [length: ${expoPublicMapKey.length}]`
      : "❌ NOT FOUND / UNDEFINED"
    );

    setRadiusMeters(5000);
  }, [setRadiusMeters]);

  const handleOpenRestaurant = (restaurant: Restaurant) => {
    if (restaurant.isFreeAvailable) {
      router.push({
        pathname: "/screens/home/product-details",
        params: {
          id: restaurant.foodId || restaurant.id,
          foodId: restaurant.foodId || restaurant.id,
          name: restaurant.mealName || restaurant.title || restaurant.restaurantName || "",
          price: String(restaurant.price ?? 0),
          image: restaurant.mealImage || restaurant.profile || "",
          description: restaurant.productDescription || "",
          restaurantName: restaurant.restaurantName || "",
          restaurantProfile: restaurant.profile || "",
          isFreeAvailable: "true",
          freeTokenCount: String(restaurant.freeTokenCount || 0),
          providerId: restaurant.providerId || restaurant.id,
        },
      });
    } else {
      router.push({
        pathname: "/screens/home/restaurant-details",
        params: {
          providerId: restaurant.providerId || restaurant.id,
          isFreeAvailable: "false",
          freeTokenCount: String(restaurant.freeTokenCount || 0),
          name: restaurant.restaurantName || (restaurant as any).name || (restaurant as any).title || "",
          image: (restaurant as any).image || (restaurant as any).profile || "",
          rating: restaurant.rating !== undefined && restaurant.rating !== null ? String(restaurant.rating) : "",
          address: restaurant.restaurantAddress || "",
          distance: (restaurant as any).distance || "",
        },
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Map Container */}
      <View style={{ flex: 1, width: "100%", height: "100%" }}>
        <RestaurantMapView onOpenRestaurant={handleOpenRestaurant} />
      </View>
    </SafeAreaView>
  );
}
