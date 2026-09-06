import { useStore } from "@/stores/stores";
import { useRestaurantStore } from "@/stores/useRestaurantStore";
import { getUserAvatarUri } from "@/utils/userAvatar";
import {
  searchAddresses,
  reverseGeocodeCoordinates,
  type GeocodeSearchResult,
  type ParsedAddress,
} from "@/utils/geocoding";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";

const RECENT_LOCATIONS_STORAGE_KEY = "@dinefive_recent_locations";
const MAX_RECENT_SEARCHES = 5;

interface HomeHeaderProps {
  name?: string;
  location?: string;
  profileImage?: string;
  onLocationPress?: () => void;
}

const pickString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
};

export const HomeHeader = ({ name, location: propLocation, profileImage }: HomeHeaderProps) => {
  const router = useRouter();
  const { user, fetchProfile } = useStore() as any;
  const {
    location,
    locationAddressLabel,
    locationLoading,
    fetchLocation,
    setSelectedParsedLocation,
    fetchNearbyRestaurants,
  } = useRestaurantStore();

  const [addressSearch, setAddressSearch] = useState("");
  const [currentLocationLabel, setCurrentLocationLabel] = useState("");
  const [isDropdownExpanded, setIsDropdownExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodeSearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<GeocodeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const avatarUri = getUserAvatarUri(user);
  const avatarSource = avatarUri ? { uri: avatarUri } : require("@/assets/images/user-icon.jpg");

  useEffect(() => {
    fetchProfile?.();
    loadRecentSearches();
  }, [fetchProfile]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_LOCATIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load recent locations:", e);
    }
  };

  const saveRecentSearch = async (item: GeocodeSearchResult) => {
    try {
      const updated = [
        item,
        ...recentSearches.filter(
          (r) =>
            r.id !== item.id &&
            !(
              Math.abs(r.parsed.lat - item.parsed.lat) < 0.0001 &&
              Math.abs(r.parsed.lng - item.parsed.lng) < 0.0001
            )
        ),
      ].slice(0, MAX_RECENT_SEARCHES);

      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_LOCATIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to save recent location:", e);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_LOCATIONS_STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear recent locations:", e);
    }
  };

  // Reverse geocode store location to display readable address in placeholder
  useEffect(() => {
    let isMounted = true;
    const resolveLocationLabel = async () => {
      if (!location) {
        setCurrentLocationLabel("No location set");
        return;
      }
      try {
        const result = await Location.reverseGeocodeAsync({
          latitude: location.latitude,
          longitude: location.longitude,
        });

        if (!isMounted) return;

        const place = result?.[0];
        const label = pickString(
          place?.district,
          place?.subregion,
          place?.city,
          place?.region,
          place?.street,
        );

        setCurrentLocationLabel(label || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
      } catch {
        if (isMounted) {
          setCurrentLocationLabel(`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
        }
      }
    };

    resolveLocationLabel();
    return () => {
      isMounted = false;
    };
  }, [location]);

  // Live Debounced Autocomplete Search against OpenStreetMap Nominatim ($0 cost)
  useEffect(() => {
    const trimmed = addressSearch.trim();

    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const items = await searchAddresses(trimmed, controller.signal);
        setSuggestions(items);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("[HomeHeader] Nominatim search error:", err);
          setSuggestions([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [addressSearch]);

  // Handle selection of a location item: update location, save to recent, and COLLAPSE dropdown
  const handleSelectLocation = async (item: GeocodeSearchResult) => {
    Keyboard.dismiss();
    setAddressSearch(item.displayName);
    setIsDropdownExpanded(false); // Collapse immediately!

    await saveRecentSearch(item);
    await setSelectedParsedLocation(item.parsed, false);
    fetchNearbyRestaurants({
      latitude: item.parsed.lat,
      longitude: item.parsed.lng,
    });
  };

  // Handle Current GPS Location Shortcut
  const handleLocateMe = async () => {
    setIsLocatingGPS(true);
    Keyboard.dismiss();

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please enable GPS location permissions in settings.");
        setIsLocatingGPS(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      const parsed = await reverseGeocodeCoordinates(latitude, longitude);

      const parsedResult: ParsedAddress = parsed || {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "United States",
        lat: latitude,
        lng: longitude,
        displayName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      };

      const resultItem: GeocodeSearchResult = {
        id: `gps_${latitude}_${longitude}`,
        displayName: parsedResult.street || parsedResult.city || "Current GPS Location",
        secondaryText: [parsedResult.city, parsedResult.state, parsedResult.zipCode]
          .filter(Boolean)
          .join(", ") || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        parsed: parsedResult,
      };

      await saveRecentSearch(resultItem);
      await setSelectedParsedLocation(parsedResult, false);
      fetchNearbyRestaurants({
        latitude: parsedResult.lat,
        longitude: parsedResult.lng,
      });
      setAddressSearch(resultItem.displayName);
      setIsDropdownExpanded(false); // Collapse immediately!
    } catch (err: any) {
      console.warn("[HomeHeader] GPS error:", err);
      Alert.alert("Error", err?.message || "Failed to retrieve device GPS location.");
    } finally {
      setIsLocatingGPS(false);
    }
  };

  const handleClearInput = () => {
    setAddressSearch("");
    setSuggestions([]);
  };

  const handleToggleCollapse = () => {
    if (isDropdownExpanded) {
      setIsDropdownExpanded(false);
      Keyboard.dismiss();
    } else {
      setIsDropdownExpanded(true);
      inputRef.current?.focus();
    }
  };

  const displayName = name || user?.name || user?.fullName || "Maria's Kitchen";
  const displayLocation = propLocation || locationAddressLabel || currentLocationLabel || user?.address || "Search location...";

  return (
    <View className="px-5 pt-3 pb-3 bg-white">
      {/* Row 1: Profile Avatar, Welcome Message and Notifications */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-3">
          <View className="w-11 h-11 rounded-full overflow-hidden bg-[#F1F1EF] items-center justify-center border border-gray-100">
            <Image
              source={avatarSource}
              contentFit="cover"
              style={{ width: "100%", height: "100%", borderRadius: 100 }}
            />
          </View>
          <View>
            <Text className="text-[10px] font-heading-medium text-gray-400 uppercase tracking-wider">Welcome back</Text>
            <Text numberOfLines={1} className="text-base font-heading text-[#1C1C1C] max-w-[190px]">
              {displayName}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/screens/home/notifications")}
          className="w-10 h-10 bg-white rounded-full items-center justify-center border border-[#EDEDED] shadow-sm relative"
        >
          <Ionicons name="notifications-outline" size={18} color="#595959" />
          <View className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </TouchableOpacity>
      </View>

      {/* Combined Card with Inline Expandable Location Suggestions Dropdown */}
      <View
        className={`mt-3.5 bg-white rounded-2xl border ${
          isDropdownExpanded
            ? "border-[#F5C518] shadow-md"
            : "border-[#EDEDEB] shadow-sm"
        } overflow-hidden`}
      >
        {/* Line 1: Live Location Search Input Field */}
        <View className="flex-row items-center h-[50px] px-3.5 bg-white">
          <View className="w-7 h-7 rounded-full bg-amber-50 items-center justify-center mr-2">
            <Ionicons name="location-sharp" size={16} color="#E29E10" />
          </View>

          <TextInput
            ref={inputRef}
            placeholder={displayLocation}
            placeholderTextColor="#8C8C8C"
            value={addressSearch}
            onChangeText={(text) => {
              setAddressSearch(text);
              if (!isDropdownExpanded) setIsDropdownExpanded(true);
            }}
            onFocus={() => setIsDropdownExpanded(true)}
            returnKeyType="search"
            autoCorrect={false}
            className="flex-1 text-xs text-[#1C1C1C] font-body-semibold py-1.5 pr-2"
          />

          <View className="flex-row items-center gap-1.5">
            {/* Clear Input Button */}
            {addressSearch.length > 0 && (
              <TouchableOpacity onPress={handleClearInput} className="p-1">
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}

            {/* GPS Locator Shortcut Button */}
            <TouchableOpacity
              onPress={handleLocateMe}
              disabled={locationLoading || isLocatingGPS}
              className="p-1.5 rounded-lg bg-amber-50 active:bg-amber-100"
            >
              {(locationLoading || isLocatingGPS) ? (
                <ActivityIndicator size="small" color="#F5C518" />
              ) : (
                <Ionicons name="locate" size={16} color="#F5C518" />
              )}
            </TouchableOpacity>

            {/* Expand / Collapse Toggle Button */}
            <TouchableOpacity
              onPress={handleToggleCollapse}
              className="p-1 rounded-md"
            >
              <Ionicons
                name={isDropdownExpanded ? "chevron-up" : "chevron-down"}
                size={16}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Inline Expandable Suggestions Dropdown ── */}
        {isDropdownExpanded && (
          <View className="border-t border-amber-100 bg-[#FCFBF8]">
            {/* Current GPS Location Quick Action */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleLocateMe}
              disabled={isLocatingGPS}
              className="flex-row items-center justify-between py-2.5 px-4 bg-[#FFFDF5] border-b border-amber-100/70"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-6 h-6 rounded-full bg-[#F5C518] items-center justify-center mr-2.5">
                  {isLocatingGPS ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="navigate" size={12} color="#FFFFFF" />
                  )}
                </View>
                <Text className="text-xs font-body-bold text-gray-900">
                  {isLocatingGPS ? "Detecting GPS location..." : "Use Current GPS Location"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#D97706" />
            </TouchableOpacity>

            {/* Suggestions & Recent Searches Scrollable Area */}
            <ScrollView
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 240 }}
              showsVerticalScrollIndicator={true}
            >
              {addressSearch.trim().length >= 2 ? (
                // Live Suggestions from Nominatim
                <View>
                  <View className="flex-row items-center justify-between px-4 py-2 bg-gray-50/80 border-b border-gray-100">
                    <Text className="text-[10px] font-body-bold uppercase tracking-wider text-gray-400">
                      Suggestions ({suggestions.length})
                    </Text>
                    {isSearching && (
                      <View className="flex-row items-center gap-1">
                        <ActivityIndicator size="small" color="#E29E10" />
                        <Text className="text-[10px] font-body text-gray-400">Searching...</Text>
                      </View>
                    )}
                  </View>

                  {suggestions.length > 0 ? (
                    suggestions.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        onPress={() => handleSelectLocation(item)}
                        className="flex-row items-center py-2.5 px-4 border-b border-gray-100/80 active:bg-amber-50/50"
                      >
                        <View className="w-7 h-7 rounded-full bg-amber-100/70 items-center justify-center mr-2.5">
                          <Ionicons name="location-sharp" size={14} color="#D97706" />
                        </View>
                        <View className="flex-1 pr-2">
                          <Text numberOfLines={1} className="text-xs font-body-bold text-gray-900">
                            {item.displayName}
                          </Text>
                          <Text numberOfLines={1} className="text-[11px] font-body text-gray-500">
                            {item.secondaryText}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
                      </TouchableOpacity>
                    ))
                  ) : !isSearching ? (
                    <View className="py-6 px-4 items-center justify-center">
                      <Text className="text-xs font-body-bold text-gray-700">No addresses found</Text>
                      <Text className="text-[11px] font-body text-gray-400 mt-0.5 text-center">
                        Try entering a street name, city, or 5-digit zip code.
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                // Recent Searches History
                <View>
                  {recentSearches.length > 0 ? (
                    <>
                      <View className="flex-row items-center justify-between px-4 py-2 bg-gray-50/80 border-b border-gray-100">
                        <Text className="text-[10px] font-body-bold uppercase tracking-wider text-gray-400">
                          Recent Searches
                        </Text>
                        <TouchableOpacity onPress={clearRecentSearches} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Text className="text-[11px] font-body-bold text-amber-600">Clear</Text>
                        </TouchableOpacity>
                      </View>

                      {recentSearches.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          activeOpacity={0.7}
                          onPress={() => handleSelectLocation(item)}
                          className="flex-row items-center py-2.5 px-4 border-b border-gray-100/80 active:bg-gray-100/60"
                        >
                          <View className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center mr-2.5">
                            <Ionicons name="time-outline" size={14} color="#4B5563" />
                          </View>
                          <View className="flex-1 pr-2">
                            <Text numberOfLines={1} className="text-xs font-body-bold text-gray-900">
                              {item.displayName}
                            </Text>
                            <Text numberOfLines={1} className="text-[11px] font-body text-gray-500">
                              {item.secondaryText}
                            </Text>
                          </View>
                          <Ionicons name="arrow-forward" size={13} color="#9CA3AF" />
                        </TouchableOpacity>
                      ))}
                    </>
                  ) : (
                    <View className="py-6 px-4 items-center justify-center">
                      <View className="w-8 h-8 rounded-full bg-amber-50 items-center justify-center mb-1.5 border border-amber-100">
                        <Ionicons name="search" size={14} color="#E29E10" />
                      </View>
                      <Text className="text-xs font-body-bold text-gray-800">Search Food Near You</Text>
                      <Text className="text-[11px] font-body text-gray-400 text-center mt-0.5 max-w-[240px]">
                        Type any US street, city, or zip code to see instant suggestions.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Quick Collapse Footer */}
            <TouchableOpacity
              onPress={() => {
                setIsDropdownExpanded(false);
                Keyboard.dismiss();
              }}
              className="py-2 bg-gray-50/90 border-t border-gray-100 items-center justify-center flex-row gap-1"
            >
              <Text className="text-[11px] font-body-semibold text-gray-500">Close Suggestions</Text>
              <Ionicons name="chevron-up" size={13} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}

        {/* Premium Thin Divider Line */}
        <View className="h-[1px] bg-[#F1F1EF] mx-4" />

        {/* Line 2: Food & Restaurant Search (Tappable search box) */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/screens/home/all-restaurants")}
          className="flex-row items-center h-[48px] px-4 bg-white"
        >
          <Ionicons name="search-outline" size={18} color="#A3A3A3" />
          <Text className="flex-1 ml-2.5 text-xs text-gray-400 font-body">
            Search dishes, restaurants...
          </Text>
          
          <View className="p-1 items-center justify-center">
            <Ionicons name="options-outline" size={18} color="#595959" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};
