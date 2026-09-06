import React, { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatRadius, RADIUS_STEPS } from "./utils/mapHelpers";
import {
  searchAddresses,
  reverseGeocodeCoordinates,
  type GeocodeSearchResult,
  type ParsedAddress,
} from "@/utils/geocoding";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const RECENT_LOCATIONS_STORAGE_KEY = "@dinefive_recent_locations";
const MAX_RECENT_SEARCHES = 5;

type Props = {
  searchText: string;
  onSearchChange: (text: string) => void;
  addressLabel: string;
  radiusMeters: number;
  onAutoLocate: () => void;
  onSelectParsedLocation: (parsed: ParsedAddress) => void;
  onRadiusPress: (radius: number) => void;
};

export default function MapSearchBar({
  searchText,
  onSearchChange,
  addressLabel,
  radiusMeters,
  onAutoLocate,
  onSelectParsedLocation,
  onRadiusPress,
}: Props) {
  const [isDropdownExpanded, setIsDropdownExpanded] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeSearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<GeocodeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadRecentSearches();
  }, []);

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

  // Live Debounced Autocomplete Search against OpenStreetMap Nominatim ($0 cost)
  useEffect(() => {
    const trimmed = locationQuery.trim();

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
          console.warn("[MapSearchBar] Search error:", err);
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
  }, [locationQuery]);

  // Handle location selection: updates coordinates and COLLAPSES dropdown
  const handleSelectLocation = async (item: GeocodeSearchResult) => {
    Keyboard.dismiss();
    setLocationQuery(item.displayName);
    setIsDropdownExpanded(false); // Collapse immediately!

    await saveRecentSearch(item);
    onSelectParsedLocation(item.parsed);
  };

  // Handle Current GPS Location Shortcut
  const handleUseGPS = async () => {
    setIsLocatingGPS(true);
    Keyboard.dismiss();

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow GPS location access in settings.");
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
      onSelectParsedLocation(parsedResult);
      setLocationQuery(resultItem.displayName);
      setIsDropdownExpanded(false); // Collapse immediately!
    } catch (err: any) {
      console.warn("[MapSearchBar] GPS error:", err);
      Alert.alert("Error", err?.message || "Failed to retrieve device GPS location.");
    } finally {
      setIsLocatingGPS(false);
    }
  };

  const handleToggleExpand = () => {
    if (isDropdownExpanded) {
      setIsDropdownExpanded(false);
      Keyboard.dismiss();
    } else {
      setIsDropdownExpanded(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  return (
    <View className="absolute top-4 left-4 right-4 z-50">
      {/* Search Header Container */}
      <View
        className={`bg-white rounded-2xl border ${
          isDropdownExpanded
            ? "border-[#FFC107] shadow-md"
            : "border-gray-100 shadow-sm"
        } overflow-hidden`}
      >
        {/* Top Search & Location Row */}
        <View className="flex-row items-center h-[50px] px-3">
          <View className="bg-amber-50 p-1.5 rounded-xl mr-2.5 border border-amber-200/60">
            <Image
              source={require("@/assets/images/icon.png")}
              style={{ width: 26, height: 26 }}
              resizeMode="contain"
            />
          </View>

          {/* Search/Location Input Field */}
          <View className="flex-1 flex-row items-center">
            <TextInput
              ref={inputRef}
              value={isDropdownExpanded ? locationQuery : searchText}
              onChangeText={(text) => {
                if (isDropdownExpanded) {
                  setLocationQuery(text);
                } else {
                  onSearchChange(text);
                }
              }}
              onFocus={() => {
                if (!isDropdownExpanded) {
                  setLocationQuery(searchText);
                  setIsDropdownExpanded(true);
                }
              }}
              placeholder={isDropdownExpanded ? "Search street, city, state, or zip..." : "Search restaurants, dishes..."}
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-[13px] text-gray-800 font-body-semibold py-1.5 pr-2"
            />
          </View>

          {/* Actions on right */}
          <View className="flex-row items-center gap-1.5">
            {isDropdownExpanded && locationQuery.length > 0 && (
              <TouchableOpacity onPress={() => setLocationQuery("")} className="p-1">
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}

            {/* GPS Locator */}
            <TouchableOpacity
              onPress={handleUseGPS}
              disabled={isLocatingGPS}
              className="p-1.5 rounded-lg bg-amber-50 active:bg-amber-100"
            >
              {isLocatingGPS ? (
                <ActivityIndicator size="small" color="#FFC107" />
              ) : (
                <Ionicons name="locate-outline" size={17} color="#FFC107" />
              )}
            </TouchableOpacity>

            <View className="w-[1px] h-4 bg-gray-200 mx-1" />

            {/* Location Pill / Expand Toggle */}
            <TouchableOpacity
              onPress={handleToggleExpand}
              className="flex-row items-center bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 max-w-[110px]"
            >
              <Ionicons name="location-sharp" size={13} color="#E29E10" />
              <Text
                className="ml-1 text-[11px] text-gray-700 font-body-bold max-w-[70px]"
                numberOfLines={1}
              >
                {addressLabel || "Set Area"}
              </Text>
              <Ionicons
                name={isDropdownExpanded ? "chevron-up" : "chevron-down"}
                size={12}
                color="#6B7280"
                style={{ marginLeft: 2 }}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Inline Expandable Suggestions Dropdown ── */}
        {isDropdownExpanded && (
          <View className="border-t border-amber-100 bg-[#FCFBF8]">
            {/* Use Current GPS Location Shortcut */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleUseGPS}
              disabled={isLocatingGPS}
              className="flex-row items-center justify-between py-2.5 px-3.5 bg-[#FFFDF5] border-b border-amber-100/70"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-6 h-6 rounded-full bg-[#FFC107] items-center justify-center mr-2.5">
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

            {/* Suggestions & Recent Searches Scroll Area */}
            <ScrollView
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 220 }}
              showsVerticalScrollIndicator={true}
            >
              {locationQuery.trim().length >= 2 ? (
                // Live Nominatim Suggestions
                <View>
                  <View className="flex-row items-center justify-between px-3.5 py-1.5 bg-gray-50/80 border-b border-gray-100">
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
                        className="flex-row items-center py-2.5 px-3.5 border-b border-gray-100/80 active:bg-amber-50/50"
                      >
                        <View className="w-6 h-6 rounded-full bg-amber-100/70 items-center justify-center mr-2.5">
                          <Ionicons name="location-sharp" size={13} color="#D97706" />
                        </View>
                        <View className="flex-1 pr-2">
                          <Text numberOfLines={1} className="text-xs font-body-bold text-gray-900">
                            {item.displayName}
                          </Text>
                          <Text numberOfLines={1} className="text-[11px] font-body text-gray-500">
                            {item.secondaryText}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={13} color="#D1D5DB" />
                      </TouchableOpacity>
                    ))
                  ) : !isSearching ? (
                    <View className="py-5 px-4 items-center justify-center">
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
                      <View className="flex-row items-center justify-between px-3.5 py-1.5 bg-gray-50/80 border-b border-gray-100">
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
                          className="flex-row items-center py-2 px-3.5 border-b border-gray-100/80 active:bg-gray-100/60"
                        >
                          <View className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center mr-2.5">
                            <Ionicons name="time-outline" size={13} color="#4B5563" />
                          </View>
                          <View className="flex-1 pr-2">
                            <Text numberOfLines={1} className="text-xs font-body-bold text-gray-900">
                              {item.displayName}
                            </Text>
                            <Text numberOfLines={1} className="text-[11px] font-body text-gray-500">
                              {item.secondaryText}
                            </Text>
                          </View>
                          <Ionicons name="arrow-forward" size={12} color="#9CA3AF" />
                        </TouchableOpacity>
                      ))}
                    </>
                  ) : (
                    <View className="py-5 px-4 items-center justify-center">
                      <View className="w-7 h-7 rounded-full bg-amber-50 items-center justify-center mb-1 border border-amber-100">
                        <Ionicons name="search" size={13} color="#E29E10" />
                      </View>
                      <Text className="text-xs font-body-bold text-gray-800">Search Food Near You</Text>
                      <Text className="text-[11px] font-body text-gray-400 text-center mt-0.5">
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
              className="py-1.5 bg-gray-50/90 border-t border-gray-100 items-center justify-center flex-row gap-1"
            >
              <Text className="text-[10px] font-body-semibold text-gray-500">Close Suggestions</Text>
              <Ionicons name="chevron-up" size={12} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Radius filter chips (only show when dropdown is collapsed) */}
      {!isDropdownExpanded && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-2"
          contentContainerStyle={{ gap: 6, paddingHorizontal: 2 }}
        >
          {RADIUS_STEPS.map((radius) => {
            const active = radius === radiusMeters;
            return (
              <TouchableOpacity
                key={radius}
                onPress={() => onRadiusPress(radius)}
                className={`px-3.5 py-1.5 rounded-full border ${
                  active
                    ? "bg-[#FFC107] border-[#FFC107]"
                    : "bg-white border-gray-200"
                }`}
                style={{ flexShrink: 0 }}
              >
                <Text
                  numberOfLines={1}
                  className={`text-xs font-body-semibold ${
                    active ? "text-gray-900" : "text-gray-500"
                  }`}
                  style={{ flexShrink: 0 }}
                >
                  {formatRadius(radius)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
