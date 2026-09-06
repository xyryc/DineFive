import { useStore } from "@/stores/stores";
import { getUserAvatarUri, normalizeImageUri } from "@/utils/userAvatar";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PhoneInput, {
  ICountry,
  getCountryByPhoneNumber,
  getNationalPhoneNumber,
  getCountryByCca2,
  isValidPhoneNumber,
} from "rn-international-phone-number";

import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRestaurantStore } from "@/stores/useRestaurantStore";
import {
  searchAddresses,
  reverseGeocodeCoordinates,
  type GeocodeSearchResult,
  type ParsedAddress,
} from "@/utils/geocoding";

const uriToBlob = (uri: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function () {
      reject(new Error("Failed to convert URI to Blob"));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
};

export default function MyAccountScreen() {
  const router = useRouter();
  const { user, updateProfile, fetchProfile } = useStore() as any;
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isAddressDropdownExpanded, setIsAddressDropdownExpanded] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<GeocodeSearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<GeocodeSearchResult[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    city?: string;
    state?: string;
    address?: string;
  }>({});

  const avatarUri = selectedImage
    ? normalizeImageUri(selectedImage) || selectedImage
    : getUserAvatarUri(user);
  const avatarSource = (avatarUri && !avatarLoadFailed)
    ? { uri: avatarUri }
    : require("@/assets/images/user-icon.jpg");

  // Initial phone and country parsing
  const getInitialPhoneData = () => {
    let parsedCountry: ICountry | null = null;
    let parsedPhone = "";
    if (user?.phone) {
      const phoneToParse = user.phone.startsWith("+") ? user.phone : "+" + user.phone;
      parsedCountry = getCountryByPhoneNumber(phoneToParse) || null;
      if (parsedCountry) {
        parsedPhone = getNationalPhoneNumber(phoneToParse);
      } else {
        parsedPhone = user.phone;
      }
    } else {
      parsedPhone = "";
    }
    return {
      phone: parsedPhone,
      country: parsedCountry || getCountryByCca2("US") || null,
    };
  };

  const initialData = getInitialPhoneData();
  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(initialData.country);

  const [formData, setFormData] = useState({
    name: user?.name || user?.fullName || "",
    email: user?.email || "",
    phone: initialData.phone,
    bio: user?.bio || user?.Boi || "",
    city: user?.city || "",
    state: user?.state || "",
    address: user?.address || "",
    lat: user?.lat || null,
    lng: user?.lng || null,
  });

  useEffect(() => {
    fetchProfile?.();
    loadRecentSearches();
  }, [fetchProfile]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem("@dinefive_recent_locations");
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
      ].slice(0, 5);

      setRecentSearches(updated);
      await AsyncStorage.setItem("@dinefive_recent_locations", JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to save recent location:", e);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem("@dinefive_recent_locations");
    } catch (e) {
      console.warn("Failed to clear recent locations:", e);
    }
  };

  // Debounced search against OpenStreetMap Nominatim for profile address
  useEffect(() => {
    if (!isAddressDropdownExpanded) return;

    const trimmed = formData.address.trim();
    if (trimmed.length < 2) {
      setAddressSuggestions([]);
      setIsSearchingAddress(false);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    setIsSearchingAddress(true);

    searchTimeoutRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const items = await searchAddresses(trimmed, controller.signal);
        setAddressSuggestions(items);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("[my-account] Address search error:", err);
          setAddressSuggestions([]);
        }
      } finally {
        setIsSearchingAddress(false);
      }
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [formData.address, isAddressDropdownExpanded]);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarUri]);

  // Validation checks for all form fields
  useEffect(() => {
    if (!isEditing) {
      setErrors({});
      return;
    }

    const newErrors: typeof errors = {};

    // Name Validation
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Phone Validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (selectedCountry && !isValidPhoneNumber(formData.phone, selectedCountry)) {
      newErrors.phone = "Invalid phone number format";
    }

    // City Validation
    if (formData.city.trim() && formData.city.trim().length < 2) {
      newErrors.city = "City must be at least 2 characters";
    }

    // State Validation
    if (formData.state.trim() && formData.state.trim().length < 2) {
      newErrors.state = "State must be at least 2 characters";
    }

    // Address Validation
    if (formData.address.trim() && formData.address.trim().length < 5) {
      newErrors.address = "Address must be at least 5 characters";
    }

    setErrors(newErrors);
  }, [formData.name, formData.phone, formData.city, formData.state, formData.address, selectedCountry, isEditing]);

  // Sync profile details when user updates
  useEffect(() => {
    if (user && !isEditing) {
      let parsedCountry: ICountry | null = null;
      let parsedPhone = user.phone || "";
      if (user.phone) {
        const phoneToParse = user.phone.startsWith("+") ? user.phone : "+" + user.phone;
        parsedCountry = getCountryByPhoneNumber(phoneToParse) || null;
        if (parsedCountry) {
          parsedPhone = getNationalPhoneNumber(phoneToParse);
        }
      }
      setSelectedCountry(parsedCountry || getCountryByCca2("US") || null);
      setFormData((prev) => ({
        ...prev,
        name: user?.name || user?.fullName || prev.name,
        email: user.email || prev.email,
        phone: parsedPhone,
        bio: user.bio || user.Boi || prev.bio,
        city: user.city || prev.city,
        state: user.state || prev.state,
        address: user.address || prev.address,
        lat: user.lat || null,
        lng: user.lng || null,
      }));
    }
  }, [user, isEditing]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocateMe = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to detect your address automatically."
        );
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = current.coords;
      const reverse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverse && reverse.length > 0) {
        const addr = reverse[0];
        const city = addr.city || addr.subregion || addr.district || "";
        const state = addr.region || "";
        const street = addr.street || addr.name || "";
        const streetNumber = addr.streetNumber || "";
        const address = [streetNumber, street].filter(Boolean).join(" ");

        setFormData((prev) => ({
          ...prev,
          city: city || prev.city,
          state: state || prev.state,
          address: address || street || prev.address,
          lat: latitude,
          lng: longitude,
        }));

        setIsAddressDropdownExpanded(false);
        Keyboard.dismiss();

        const recentItem: GeocodeSearchResult = {
          id: `gps_${latitude}_${longitude}`,
          displayName: address || street || city || "Current Location",
          secondaryText: [city, state].filter(Boolean).join(", "),
          parsed: {
            street: address || street,
            city,
            state,
            zipCode: addr.postalCode || "",
            country: addr.country || "United States",
            lat: latitude,
            lng: longitude,
            displayName: [address || street, city, state].filter(Boolean).join(", "),
          },
        };
        saveRecentSearch(recentItem);

        Alert.alert("Success", "Detected and filled your location details!");
      } else {
        Alert.alert("Error", "Could not resolve address details for your coordinates.");
      }
    } catch (err: any) {
      console.log("Locate me error:", err);
      Alert.alert("Error", err?.message || "Failed to retrieve location details.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleSelectAddress = async (parsed: ParsedAddress) => {
    setFormData((prev) => ({
      ...prev,
      city: parsed.city || prev.city,
      state: parsed.state || prev.state,
      address: parsed.street || parsed.displayName || prev.address,
      lat: parsed.lat || prev.lat,
      lng: parsed.lng || prev.lng,
    }));
    setIsAddressDropdownExpanded(false); // Collapse dropdown immediately!
    Keyboard.dismiss();

    const recentItem: GeocodeSearchResult = {
      id: `${parsed.lat}_${parsed.lng}`,
      displayName: parsed.street || parsed.city || parsed.displayName,
      secondaryText: [parsed.city, parsed.state, parsed.zipCode].filter(Boolean).join(", "),
      parsed,
    };
    await saveRecentSearch(recentItem);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/profile");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsAddressDropdownExpanded(false);
    setSelectedImage(null);
    if (user) {
      let parsedCountry: ICountry | null = null;
      let parsedPhone = user.phone || "";
      if (user.phone) {
        const phoneToParse = user.phone.startsWith("+") ? user.phone : "+" + user.phone;
        parsedCountry = getCountryByPhoneNumber(phoneToParse) || null;
        if (parsedCountry) {
          parsedPhone = getNationalPhoneNumber(phoneToParse);
        }
      }
      setSelectedCountry(parsedCountry || getCountryByCca2("US") || null);
      setFormData({
        name: user.name || user.fullName || "",
        email: user.email || "",
        phone: parsedPhone,
        bio: user.bio || user.Boi || "",
        city: user.city || "",
        state: user.state || "",
        address: user.address || "",
        lat: user.lat || null,
        lng: user.lng || null,
      });
    }
  };

  const handleSave = async () => {
    // Run final validation
    const finalErrors: typeof errors = {};
    if (!formData.name.trim()) {
      finalErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      finalErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.phone.trim()) {
      finalErrors.phone = "Phone number is required";
    } else if (selectedCountry && !isValidPhoneNumber(formData.phone, selectedCountry)) {
      finalErrors.phone = "Invalid phone number format";
    }

    if (formData.city.trim() && formData.city.trim().length < 2) {
      finalErrors.city = "City must be at least 2 characters";
    }

    if (formData.state.trim() && formData.state.trim().length < 2) {
      finalErrors.state = "State must be at least 2 characters";
    }

    if (formData.address.trim() && formData.address.trim().length < 5) {
      finalErrors.address = "Address must be at least 5 characters";
    }

    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      return;
    }

    setIsLoading(true);
    try {
      let finalLat = formData.lat !== null && formData.lat !== undefined ? Number(formData.lat) : null;
      let finalLng = formData.lng !== null && formData.lng !== undefined ? Number(formData.lng) : null;
      let finalCity = formData.city;
      let finalState = formData.state;

      // Auto-geocode address if user typed it manually without picking a suggestion
      if (formData.address.trim() && (finalLat === null || finalLng === null)) {
        try {
          const query = [formData.address, formData.city, formData.state].filter(Boolean).join(", ");
          const geocodeResults = await searchAddresses(query);
          if (geocodeResults && geocodeResults.length > 0) {
            const topResult = geocodeResults[0];
            finalLat = topResult.parsed.lat;
            finalLng = topResult.parsed.lng;
            if (!finalCity && topResult.parsed.city) finalCity = topResult.parsed.city;
            if (!finalState && topResult.parsed.state) finalState = topResult.parsed.state;
            console.log("📍 [my-account] Auto-geocoded coordinates on save:", { finalLat, finalLng });
          }
        } catch (geocodeErr) {
          console.warn("Auto-geocoding on save failed:", geocodeErr);
        }
      }

      const callingCode = selectedCountry
        ? selectedCountry.idd.root
        : "";
      const callingCodeDigits = callingCode.replace(/\D/g, "");
      let nationalPhone = (formData.phone || "").replace(/\D/g, "");
      if (callingCodeDigits && nationalPhone.startsWith(callingCodeDigits) && nationalPhone.length > callingCodeDigits.length) {
        nationalPhone = nationalPhone.substring(callingCodeDigits.length);
      }
      const fullPhone = callingCode ? `${callingCode}${nationalPhone}` : nationalPhone;

      console.log("Saving profile data for:", formData.name, "with phone:", fullPhone);

      // Clean payload: omit empty fields to prevent backend validation errors on empty strings
      const payload: any = {
        name: formData.name,
        phone: fullPhone,
      };

      if (formData.bio.trim()) payload.bio = formData.bio;
      if (finalCity?.trim()) payload.city = finalCity;
      if (finalState?.trim()) payload.state = finalState;
      if (formData.address.trim()) payload.address = formData.address;
      if (finalLat !== null && finalLat !== undefined) payload.lat = Number(finalLat);
      if (finalLng !== null && finalLng !== undefined) payload.lng = Number(finalLng);

      let dataToUpdate: any;
      if (selectedImage) {
        const form = new FormData();
        form.append("name", payload.name);
        form.append("phone", payload.phone);
        if (payload.bio) form.append("bio", payload.bio);
        if (payload.city) form.append("city", payload.city);
        if (payload.state) form.append("state", payload.state);
        if (payload.address) form.append("address", payload.address);
        if (payload.lat !== null && payload.lat !== undefined) form.append("lat", String(payload.lat));
        if (payload.lng !== null && payload.lng !== undefined) form.append("lng", String(payload.lng));

        const filename = selectedImage.split("/").pop() || "profile.jpg";
        const blob = await uriToBlob(selectedImage);
        form.append("profilePic", blob, filename);
        dataToUpdate = form;
      } else {
        dataToUpdate = payload;
      }

      const result = await updateProfile(dataToUpdate);

      if (result) {
        await fetchProfile?.();

        // 🌟 Sync saved profile location globally across Home, Map, and Store!
        if (finalLat !== null && finalLng !== null) {
          const fullAddressLabel = formData.address || [finalCity, finalState].filter(Boolean).join(", ");
          const parsedLocation: ParsedAddress = {
            street: formData.address,
            city: finalCity,
            state: finalState,
            zipCode: "",
            country: "United States",
            lat: finalLat,
            lng: finalLng,
            displayName: fullAddressLabel,
          };

          // 1. Update active location & label in useRestaurantStore
          await useRestaurantStore.getState().setSelectedParsedLocation(parsedLocation, false);

          // 2. Persist to AsyncStorage for cold app launches
          await AsyncStorage.setItem("DINE_FIVE_USER_LOCATION", JSON.stringify({
            latitude: finalLat,
            longitude: finalLng,
          }));

          // 3. Save to recent searches
          const recentItem: GeocodeSearchResult = {
            id: `${finalLat}_${finalLng}`,
            displayName: formData.address || finalCity || fullAddressLabel,
            secondaryText: [finalCity, finalState].filter(Boolean).join(", "),
            parsed: parsedLocation,
          };
          await saveRecentSearch(recentItem);

          // 4. Immediately trigger nearby restaurant re-query for the new home location!
          useRestaurantStore.getState().fetchNearbyRestaurants({
            latitude: finalLat,
            longitude: finalLng,
          });
        }

        Alert.alert("Success", "Profile updated successfully");
        setIsEditing(false);
        setIsAddressDropdownExpanded(false);
        setSelectedImage(null);
      } else {
        const storeError = (useStore.getState() as any).error;
        Alert.alert("Error", storeError || "Failed to update profile");
      }
    } catch (error: any) {
      console.log("Save error:", error);
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FBF9F6]" edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-3 pb-4">
          {isEditing ? (
            <TouchableOpacity
              onPress={handleCancel}
              activeOpacity={0.7}
              className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-100 shadow-sm"
              disabled={isLoading}
            >
              <Ionicons name="close" size={20} color="#1F2937" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.7}
              className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-100 shadow-sm"
            >
              <Ionicons name="chevron-back" size={20} color="#1F2937" />
            </TouchableOpacity>
          )}

          <Text className="text-lg font-heading text-gray-900">
            {isEditing ? "Edit Profile" : "Profile Details"}
          </Text>

          {isEditing ? (
            isLoading ? (
              <View className="px-4 py-1.5 rounded-full bg-gray-50 border border-gray-100 items-center justify-center" style={{ minWidth: 60 }}>
                <ActivityIndicator size="small" color="#E29E10" />
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.7}
                className="px-4 py-1.5 rounded-full bg-[#FFF8E7] border border-[#FFE8B5]"
              >
                <Text className="text-[#E29E10] font-body-bold text-sm">Save</Text>
              </TouchableOpacity>
            )
          ) : (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              activeOpacity={0.7}
              className="px-4 py-1.5 rounded-full bg-[#FFF8E7] border border-[#FFE8B5]"
            >
              <Text className="text-[#E29E10] font-body-semibold text-sm">Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          className="flex-1 px-6"
        >
          {/* Profile Card Section */}
          <View className="items-center mt-4 mb-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative">
            <View className="relative">
              <View
                className="w-28 h-28 rounded-full overflow-hidden border-4 border-white bg-white"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Image
                  key={avatarUri || "default"}
                  source={avatarSource}
                  style={{ width: "100%", height: "100%", borderRadius: 999 }}
                  contentFit="cover"
                  onError={() => setAvatarLoadFailed(true)}
                />
              </View>
              {isEditing && (
                <TouchableOpacity
                  onPress={pickImage}
                  activeOpacity={0.8}
                  className="absolute bottom-0 right-0 bg-gray-900 w-9 h-9 rounded-full items-center justify-center border-2 border-white shadow-md"
                >
                  <Ionicons name="camera" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
            <Text className="text-xl font-heading text-gray-900 mt-4 text-center">
              {formData.name || "User"}
            </Text>
            <Text className="text-gray-400 text-sm font-body-medium mt-1 text-center">
              {formData.email}
            </Text>
          </View>

          {/* Form Fields Card */}
          <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm gap-y-5">
            {/* Full Name */}
            <View className="gap-y-1.5">
              <Text className="text-[11px] font-body-semibold text-gray-400 uppercase tracking-widest ml-1">
                Full Name
              </Text>
              <View
                className={`flex-row items-center px-4 rounded-2xl border ${
                  isEditing
                    ? "bg-white border-gray-200"
                    : "bg-gray-50 border-transparent"
                }`}
                style={{ height: 56 }}
              >
                <Ionicons name="person-outline" size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
                {isEditing ? (
                  <TextInput
                    value={formData.name}
                    onChangeText={(t) => handleChange("name", t)}
                    placeholder="Enter name"
                    className="flex-1 text-base font-body-semibold text-gray-900 p-0"
                    placeholderTextColor="#9CA3AF"
                  />
                ) : (
                  <Text className="flex-1 text-base font-body-semibold text-gray-800">
                    {formData.name || "Not set"}
                  </Text>
                )}
              </View>
              {isEditing && errors.name && (
                <Text className="text-red-500 text-xs mt-1 ml-1 font-body-semibold">
                  {errors.name}
                </Text>
              )}
            </View>

            {/* Email Address (Read-only always to protect account consistency) */}
            <View className="gap-y-1.5">
              <Text className="text-[11px] font-body-semibold text-gray-400 uppercase tracking-widest ml-1">
                Email Address
              </Text>
              <View
                className="flex-row items-center px-4 rounded-2xl border bg-gray-50 border-transparent"
                style={{ height: 56 }}
              >
                <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
                <Text className="flex-1 text-base font-body-semibold text-gray-400">
                  {formData.email}
                </Text>
              </View>
            </View>

            {/* Phone Number */}
            <View className="gap-y-1.5">
              <Text className="text-[11px] font-body-semibold text-gray-400 uppercase tracking-widest ml-1">
                Phone Number
              </Text>
              <View
                className={`flex-row items-center rounded-2xl ${
                  isEditing ? "bg-white" : "bg-gray-50"
                }`}
                style={{ height: 56 }}
              >
                <PhoneInput
                  value={formData.phone}
                  onChangePhoneNumber={(t) => handleChange("phone", t)}
                  country={selectedCountry}
                  onChangeCountry={setSelectedCountry}
                  disabled={!isEditing}
                  modalDisabled={!isEditing}
                  placeholder="Phone number"
                  theme="light"
                  phoneInputStyles={{
                    container: {
                      backgroundColor: 'transparent',
                      borderWidth: 1,
                      borderColor: isEditing ? '#E5E7EB' : 'transparent',
                      borderRadius: 16,
                      height: 56,
                      width: '100%',
                    },
                    flagContainer: {
                      backgroundColor: 'transparent',
                      borderTopLeftRadius: 16,
                      borderBottomLeftRadius: 16,
                    },
                    input: {
                      fontSize: 16,
                      fontWeight: '600',
                      color: isEditing ? '#111827' : '#1F2937',
                    },
                    callingCode: {
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#111827',
                    },
                    divider: {
                      backgroundColor: isEditing ? '#E5E7EB' : 'transparent',
                    },
                  }}
                />
              </View>
              {isEditing && errors.phone && (
                <Text className="text-red-500 text-xs mt-1 ml-1 font-body-semibold">
                  {errors.phone}
                </Text>
              )}
            </View>

            {/* Bio */}
            <View className="gap-y-1.5">
              <Text className="text-[11px] font-body-semibold text-gray-400 uppercase tracking-widest ml-1">
                Bio / About Me
              </Text>
              <View
                className={`flex-row items-start px-4 py-3.5 rounded-2xl border ${
                  isEditing
                    ? "bg-white border-gray-200"
                    : "bg-gray-50 border-transparent"
                }`}
                style={{ minHeight: 90 }}
              >
                <Ionicons name="document-text-outline" size={18} color="#9CA3AF" style={{ marginRight: 10, marginTop: 2 }} />
                {isEditing ? (
                  <TextInput
                    value={formData.bio}
                    onChangeText={(t) => handleChange("bio", t)}
                    placeholder="Tell us about yourself..."
                    multiline
                    numberOfLines={3}
                    className="flex-1 text-base font-body-semibold text-gray-900 leading-5 p-0"
                    placeholderTextColor="#9CA3AF"
                    style={{ textAlignVertical: 'top' }}
                  />
                ) : (
                  <Text className="flex-1 text-base font-body-semibold text-gray-800 leading-5">
                    {formData.bio || "No bio added yet"}
                  </Text>
                )}
              </View>
            </View>

            {/* Locate Me Quick Action */}
            {isEditing && (
              <TouchableOpacity
                onPress={handleLocateMe}
                disabled={isLocating}
                activeOpacity={0.7}
                className="flex-row items-center justify-center gap-x-2 py-3 rounded-2xl border border-dashed border-[#E29E10] bg-[#FFF8E7]"
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color="#E29E10" />
                ) : (
                  <Ionicons name="navigate-outline" size={16} color="#E29E10" />
                )}
                <Text className="text-[#E29E10] font-body-bold text-xs">
                  {isLocating ? "Detecting GPS Location..." : "Auto-Fill Location with GPS"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Street Address with Inline Expandable Autocomplete Dropdown */}
            <View className="gap-y-1.5">
              <Text className="text-[11px] font-body-semibold text-gray-400 uppercase tracking-widest ml-1">
                Street Address
              </Text>
              <View
                className={`rounded-2xl border ${
                  isEditing
                    ? isAddressDropdownExpanded
                      ? "bg-white border-[#E29E10]"
                      : "bg-white border-gray-200"
                    : "bg-gray-50 border-transparent"
                } overflow-hidden`}
              >
                {/* Address Input Row */}
                <View className="flex-row items-center px-4" style={{ height: 56 }}>
                  <Ionicons name="map-outline" size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
                  {isEditing ? (
                    <TextInput
                      value={formData.address}
                      onChangeText={(t) => {
                        handleChange("address", t);
                        if (!isAddressDropdownExpanded) setIsAddressDropdownExpanded(true);
                      }}
                      onFocus={() => setIsAddressDropdownExpanded(true)}
                      placeholder="Enter street address or city..."
                      className="flex-1 text-base font-body-semibold text-gray-900 p-0"
                      placeholderTextColor="#9CA3AF"
                    />
                  ) : (
                    <Text className="flex-1 text-base font-body-semibold text-gray-800">
                      {formData.address || "No address added yet"}
                    </Text>
                  )}

                  {isEditing && (
                    <View className="flex-row items-center gap-1">
                      {formData.address.length > 0 && (
                        <TouchableOpacity
                          onPress={() => {
                            handleChange("address", "");
                            setAddressSuggestions([]);
                          }}
                          className="p-1"
                        >
                          <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={() => setIsAddressDropdownExpanded(!isAddressDropdownExpanded)}
                        className="p-1"
                      >
                        <Ionicons
                          name={isAddressDropdownExpanded ? "chevron-up" : "chevron-down"}
                          size={16}
                          color="#6B7280"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* ── Inline Expandable Suggestions Dropdown ── */}
                {isEditing && isAddressDropdownExpanded && (
                  <View className="border-t border-amber-100 bg-[#FCFBF8]">
                    {/* Use Current GPS Shortcut */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleLocateMe}
                      disabled={isLocating}
                      className="flex-row items-center justify-between py-2.5 px-4 bg-[#FFFDF5] border-b border-amber-100"
                    >
                      <View className="flex-row items-center flex-1 mr-2">
                        <View className="w-6 h-6 rounded-full bg-[#E29E10] items-center justify-center mr-2.5">
                          {isLocating ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Ionicons name="navigate" size={12} color="#FFFFFF" />
                          )}
                        </View>
                        <Text className="text-xs font-body-bold text-gray-900">
                          {isLocating ? "Detecting GPS location..." : "Use Current GPS Location"}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color="#D97706" />
                    </TouchableOpacity>

                    {/* Scrollable Suggestions / Recent Searches */}
                    <ScrollView
                      nestedScrollEnabled={true}
                      keyboardShouldPersistTaps="handled"
                      style={{ maxHeight: 220 }}
                      showsVerticalScrollIndicator={true}
                    >
                      {formData.address.trim().length >= 2 ? (
                        // Live Nominatim Suggestions
                        <View>
                          <View className="flex-row items-center justify-between px-4 py-1.5 bg-gray-50 border-b border-gray-100">
                            <Text className="text-[10px] font-body-bold uppercase tracking-wider text-gray-400">
                              Suggestions ({addressSuggestions.length})
                            </Text>
                            {isSearchingAddress && (
                              <View className="flex-row items-center gap-1">
                                <ActivityIndicator size="small" color="#E29E10" />
                                <Text className="text-[10px] font-body text-gray-400">Searching...</Text>
                              </View>
                            )}
                          </View>

                          {addressSuggestions.length > 0 ? (
                            addressSuggestions.map((item) => (
                              <TouchableOpacity
                                key={item.id}
                                activeOpacity={0.7}
                                onPress={() => handleSelectAddress(item.parsed)}
                                className="flex-row items-center py-2.5 px-4 border-b border-gray-100 active:bg-amber-50"
                              >
                                <View className="w-6 h-6 rounded-full bg-amber-100 items-center justify-center mr-2.5">
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
                          ) : !isSearchingAddress ? (
                            <View className="py-4 px-4 items-center justify-center">
                              <Text className="text-xs font-body-bold text-gray-700">No addresses found</Text>
                              <Text className="text-[11px] font-body text-gray-400 mt-0.5 text-center">
                                Try entering a street name, city, or 5-digit zip code.
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ) : (
                        // Recent Searches
                        <View>
                          {recentSearches.length > 0 ? (
                            <>
                              <View className="flex-row items-center justify-between px-4 py-1.5 bg-gray-50 border-b border-gray-100">
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
                                  onPress={() => handleSelectAddress(item.parsed)}
                                  className="flex-row items-center py-2 px-4 border-b border-gray-100 active:bg-gray-100"
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
                            <View className="py-4 px-4 items-center justify-center">
                              <Text className="text-xs font-body-bold text-gray-800">Auto-Complete Address</Text>
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
                        setIsAddressDropdownExpanded(false);
                        Keyboard.dismiss();
                      }}
                      className="py-1.5 bg-gray-50 border-t border-gray-100 items-center justify-center flex-row gap-1"
                    >
                      <Text className="text-[10px] font-body-semibold text-gray-500">Close Suggestions</Text>
                      <Ionicons name="chevron-up" size={12} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {isEditing && errors.address && (
                <Text className="text-red-500 text-xs mt-1 ml-1 font-body-semibold">
                  {errors.address}
                </Text>
              )}
            </View>

            {/* City & State (Row Layout) */}
            <View className="flex-row gap-x-4">
              <View className="flex-1 gap-y-1.5">
                <Text className="text-[11px] font-body-semibold text-gray-400 uppercase tracking-widest ml-1">
                  City
                </Text>
                <View
                  className={`flex-row items-center px-4 rounded-2xl border ${
                    isEditing
                      ? "bg-white border-gray-200"
                      : "bg-gray-50 border-transparent"
                  }`}
                  style={{ height: 56 }}
                >
                  <Ionicons name="location-outline" size={18} color="#9CA3AF" style={{ marginRight: 6 }} />
                  {isEditing ? (
                    <TextInput
                      value={formData.city}
                      onChangeText={(t) => handleChange("city", t)}
                      placeholder="City"
                      className="flex-1 text-base font-body-semibold text-gray-900 p-0"
                      placeholderTextColor="#9CA3AF"
                    />
                  ) : (
                    <Text className="flex-1 text-base font-body-semibold text-gray-800">
                      {formData.city || "Not set"}
                    </Text>
                  )}
                </View>
                {isEditing && errors.city && (
                  <Text className="text-red-500 text-xs mt-1 ml-1 font-body-semibold">
                    {errors.city}
                  </Text>
                )}
              </View>

              <View className="flex-1 gap-y-1.5">
                <Text className="text-[11px] font-body-semibold text-gray-400 uppercase tracking-widest ml-1">
                  State
                </Text>
                <View
                  className={`flex-row items-center px-4 rounded-2xl border ${
                    isEditing
                      ? "bg-white border-gray-200"
                      : "bg-gray-50 border-transparent"
                  }`}
                  style={{ height: 56 }}
                >
                  {isEditing ? (
                    <TextInput
                      value={formData.state}
                      onChangeText={(t) => handleChange("state", t)}
                      placeholder="State"
                      className="flex-1 text-base font-body-semibold text-gray-900 p-0"
                      placeholderTextColor="#9CA3AF"
                    />
                  ) : (
                    <Text className="flex-1 text-base font-body-semibold text-gray-800">
                      {formData.state || "Not set"}
                    </Text>
                  )}
                </View>
                {isEditing && errors.state && (
                  <Text className="text-red-500 text-xs mt-1 ml-1 font-body-semibold">
                    {errors.state}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
