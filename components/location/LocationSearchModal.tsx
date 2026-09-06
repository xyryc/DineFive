import React, { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  searchAddresses,
  reverseGeocodeCoordinates,
  type GeocodeSearchResult,
  type ParsedAddress,
} from "@/utils/geocoding";
import { useRestaurantStore } from "@/stores/useRestaurantStore";

const RECENT_LOCATIONS_STORAGE_KEY = "@dinefive_recent_locations";
const MAX_RECENT_SEARCHES = 5;

export interface LocationSearchModalProps {
  visible: boolean;
  onClose: () => void;
  /**
   * Optional custom callback when user selects an address.
   * If omitted, updates the global useRestaurantStore location automatically.
   */
  onSelectAddress?: (parsed: ParsedAddress) => void | Promise<void>;
  title?: string;
  placeholder?: string;
}

export default function LocationSearchModal({
  visible,
  onClose,
  onSelectAddress,
  title = "Find Your Location",
  placeholder = "Search street, city, state, or zip...",
}: LocationSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeSearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<GeocodeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const { setSelectedParsedLocation } = useRestaurantStore();
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Load recent searches from AsyncStorage when modal opens
  useEffect(() => {
    if (visible) {
      loadRecentSearches();
      setQuery("");
      setResults([]);
      setGpsError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 120);
    }
  }, [visible]);

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

  // Debounced search effect
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
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
        setResults(items);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("[LocationSearchModal] Search error:", err);
          setResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 380);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [query]);

  const handleSelectLocation = async (item: GeocodeSearchResult) => {
    Keyboard.dismiss();
    await saveRecentSearch(item);

    if (onSelectAddress) {
      await onSelectAddress(item.parsed);
    } else {
      await setSelectedParsedLocation(item.parsed);
    }

    onClose();
  };

  const handleUseGPS = async () => {
    setIsLocatingGPS(true);
    setGpsError(null);
    Keyboard.dismiss();

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGpsError("Location permission was denied. Please allow access in settings.");
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

      if (onSelectAddress) {
        await onSelectAddress(parsedResult);
      } else {
        await setSelectedParsedLocation(parsedResult);
      }

      onClose();
    } catch (err: any) {
      console.warn("[LocationSearchModal] GPS error:", err);
      setGpsError(err.message || "Failed to retrieve current GPS location.");
    } finally {
      setIsLocatingGPS(false);
    }
  };

  const renderSuggestionItem = ({ item }: { item: GeocodeSearchResult }) => (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => handleSelectLocation(item)}
      className="flex-row items-center py-3.5 px-4 border-b border-gray-100/70 active:bg-amber-50/40"
    >
      <View className="w-9 h-9 rounded-2xl bg-amber-100/80 items-center justify-center mr-3 border border-amber-200/60">
        <Ionicons name="location-sharp" size={17} color="#D97706" />
      </View>
      <View className="flex-1 pr-2">
        <Text numberOfLines={1} className="text-sm font-body-bold text-gray-900 mb-0.5">
          {item.displayName}
        </Text>
        <Text numberOfLines={1} className="text-xs font-body text-gray-500">
          {item.secondaryText}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </TouchableOpacity>
  );

  const renderRecentItem = ({ item }: { item: GeocodeSearchResult }) => (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => handleSelectLocation(item)}
      className="flex-row items-center py-3.5 px-4 border-b border-gray-100/70 active:bg-gray-50"
    >
      <View className="w-9 h-9 rounded-2xl bg-gray-100/90 items-center justify-center mr-3 border border-gray-200/60">
        <Ionicons name="time-outline" size={17} color="#4B5563" />
      </View>
      <View className="flex-1 pr-2">
        <Text numberOfLines={1} className="text-sm font-body-bold text-gray-900 mb-0.5">
          {item.displayName}
        </Text>
        <Text numberOfLines={1} className="text-xs font-body text-gray-500">
          {item.secondaryText}
        </Text>
      </View>
      <Ionicons name="arrow-forward" size={14} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      {/* Dimmed Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            justifyContent: "flex-start",
            paddingTop: Platform.OS === "ios" ? 54 : 42,
            paddingHorizontal: 16,
            paddingBottom: 24,
          }}
        >
          {/* Floating Glass Island Card */}
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.98)",
                borderRadius: 26,
                borderWidth: 1.5,
                borderColor: "rgba(245, 197, 24, 0.4)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.18,
                shadowRadius: 24,
                elevation: 14,
                maxHeight: "88%",
                overflow: "hidden",
              }}
            >
              {/* Card Header */}
              <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100/90 bg-white">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-full bg-amber-50 items-center justify-center border border-amber-200/50">
                    <Ionicons name="location" size={16} color="#E29E10" />
                  </View>
                  <View>
                    <Text className="text-base font-heading text-gray-900 leading-tight">
                      {title}
                    </Text>
                    <Text className="text-[10px] font-body text-gray-400">
                      Free live suggestions
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200"
                >
                  <Ionicons name="close" size={18} color="#4B5563" />
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View className="px-4 pt-3 pb-2 bg-white">
                <View className="flex-row items-center bg-[#F9FAFB] border border-gray-200 rounded-2xl px-3.5 h-12">
                  <Ionicons name="search" size={18} color="#9CA3AF" />
                  <TextInput
                    ref={inputRef}
                    value={query}
                    onChangeText={setQuery}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    returnKeyType="search"
                    autoCorrect={false}
                    autoCapitalize="words"
                    clearButtonMode="never"
                    className="flex-1 ml-2.5 text-sm font-body-semibold text-gray-900 p-0"
                  />
                  {isSearching ? (
                    <ActivityIndicator size="small" color="#E29E10" />
                  ) : query.length > 0 ? (
                    <TouchableOpacity
                      onPress={() => setQuery("")}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* GPS Shortcut Action Button */}
              <View className="px-4 pt-1 pb-2 bg-white">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleUseGPS}
                  disabled={isLocatingGPS}
                  className="flex-row items-center justify-between p-3 bg-[#FFFDF5] border border-[#FDE68A] rounded-2xl shadow-sm"
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="w-8 h-8 rounded-full bg-[#F5C518] items-center justify-center mr-2.5 shadow-sm">
                      {isLocatingGPS ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="navigate" size={15} color="#FFFFFF" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-body-bold text-gray-900">
                        {isLocatingGPS ? "Detecting location..." : "Use Current GPS Location"}
                      </Text>
                      <Text className="text-[10px] font-body text-gray-500">
                        Auto-locate & find nearby restaurants
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color="#D97706" />
                </TouchableOpacity>

                {gpsError && (
                  <View className="mt-2 p-2.5 bg-red-50 rounded-xl border border-red-100 flex-row items-center">
                    <Ionicons name="alert-circle" size={16} color="#EF4444" className="mr-1.5" />
                    <Text className="text-xs font-body text-red-600 flex-1 ml-1.5">{gpsError}</Text>
                  </View>
                )}
              </View>

              {/* Scrollable Results Area */}
              <View className="flex-1 bg-white" style={{ minHeight: 180, maxHeight: 380 }}>
                {query.trim().length >= 2 ? (
                  // Live Autocomplete Suggestions
                  <FlatList
                    data={results}
                    keyExtractor={(item) => item.id}
                    renderItem={renderSuggestionItem}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 24 }}
                    ListHeaderComponent={() => (
                      <View className="px-4 pt-2.5 pb-1.5 bg-gray-50/60 border-y border-gray-100/60">
                        <Text className="text-[10px] font-body-bold uppercase tracking-wider text-gray-400">
                          Suggestions ({results.length})
                        </Text>
                      </View>
                    )}
                    ListEmptyComponent={() =>
                      !isSearching ? (
                        <View className="items-center justify-center py-12 px-6">
                          <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mb-2.5">
                            <Ionicons name="location-outline" size={22} color="#9CA3AF" />
                          </View>
                          <Text className="text-sm font-heading text-gray-900 mb-1">
                            No Addresses Found
                          </Text>
                          <Text className="text-xs font-body text-gray-400 text-center max-w-[240px]">
                            Try entering a street name, city, or 5-digit zip code.
                          </Text>
                        </View>
                      ) : null
                    }
                  />
                ) : (
                  // Recent Searches List
                  <FlatList
                    data={recentSearches}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRecentItem}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 24 }}
                    ListHeaderComponent={() =>
                      recentSearches.length > 0 ? (
                        <View className="flex-row items-center justify-between px-4 pt-2.5 pb-1.5 bg-gray-50/60 border-y border-gray-100/60">
                          <Text className="text-[10px] font-body-bold uppercase tracking-wider text-gray-400">
                            Recent Searches
                          </Text>
                          <TouchableOpacity onPress={clearRecentSearches} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Text className="text-xs font-body-bold text-amber-600">Clear</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null
                    }
                    ListEmptyComponent={() => (
                      <View className="items-center justify-center py-12 px-6">
                        <View className="w-12 h-12 rounded-full bg-amber-50 items-center justify-center mb-2.5 border border-amber-100">
                          <Ionicons name="search" size={20} color="#E29E10" />
                        </View>
                        <Text className="text-sm font-heading text-gray-800 mb-1">
                          Find Food Around You
                        </Text>
                        <Text className="text-xs font-body text-gray-400 text-center max-w-[240px]">
                          Type any street, city, or zip code in the US to see instant suggestions.
                        </Text>
                      </View>
                    )}
                  />
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
