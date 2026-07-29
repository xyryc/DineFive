import React, { useState } from "react";
import { Text, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Marker } from "react-native-maps";
import { normalizeImageUri } from "@/utils/userAvatar";
import { Restaurant } from "@/stores/useRestaurantStore";
import { formatRestaurantDistance, getRestaurantCoords } from "./utils/mapHelpers";

type Props = {
  restaurant: Restaurant;
  isSelected: boolean;
  onPress: () => void;
};

export default function MapMarkerItem({ restaurant, isSelected, onPress }: Props) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  const coords = getRestaurantCoords(restaurant);
  if (!coords) return null;

  const rawUri =
    restaurant.profile ||
    (restaurant as any).image ||
    (restaurant as any).mealImage ||
    (restaurant as any).profilePic ||
    (restaurant as any).logo ||
    "";
  const profileUri = normalizeImageUri(rawUri);
  const distanceLabel = formatRestaurantDistance(restaurant.distance);
  const name = restaurant.restaurantName || (restaurant as any).name || "Restaurant";

  return (
    <Marker coordinate={coords} onPress={onPress} tracksViewChanges={tracksViewChanges}>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        {/* Name + Distance pill */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: isSelected ? "#111827" : "#FFFFFF",
            borderColor: isSelected ? "#111827" : "#E5E7EB",
            borderWidth: 1,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
            marginBottom: 4,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: isSelected ? "#F5C518" : "#111827",
              maxWidth: 110,
            }}
            numberOfLines={1}
          >
            {name}
          </Text>
          {distanceLabel ? (
            <View
              style={{
                backgroundColor: "#F5C518",
                paddingHorizontal: 6,
                paddingVertical: 1,
                borderRadius: 999,
                marginLeft: 6,
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: "800", color: "#111827" }}>
                {distanceLabel}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Avatar badge */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: isSelected ? "#F5C518" : "#FFFFFF",
            borderWidth: 2.5,
            borderColor: isSelected ? "#111827" : "#F5C518",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 5,
            elevation: 5,
            overflow: "hidden",
          }}
        >
          {profileUri ? (
            <ExpoImage
              source={{ uri: profileUri }}
              style={{ width: 39, height: 39, borderRadius: 19.5 }}
              contentFit="cover"
              onLoadEnd={() => setTracksViewChanges(false)}
              onError={() => setTracksViewChanges(false)}
            />
          ) : (
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: isSelected ? "#F5C518" : "#FFFBEB",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="restaurant"
                size={22}
                color={isSelected ? "#FFFFFF" : "#F5C518"}
              />
            </View>
          )}
        </View>

        {/* Pointer triangle */}
        <View
          style={{
            width: 8,
            height: 8,
            backgroundColor: isSelected ? "#111827" : "#F5C518",
            transform: [{ rotate: "45deg" }],
            marginTop: -4,
          }}
        />
      </View>
    </Marker>
  );
}
