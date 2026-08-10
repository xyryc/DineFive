import React from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRestaurantStore } from "@/stores/useRestaurantStore";

type Props = {
  onEnableGPS: () => void;
  onManualAddress: () => void;
};

/**
 * Full-screen card shown when location permission is denied.
 * Offers GPS enable and manual address entry.
 */
export function LocationPermissionBanner({ onEnableGPS, onManualAddress }: Props) {
  const { setLocationManually } = useRestaurantStore();
  const [manualInput, setManualInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSet = async () => {
    if (!manualInput.trim() || loading) return;
    setLoading(true);
    const res = await setLocationManually(manualInput);
    setLoading(false);
    if (!res?.success) {
      Alert.alert("Error", res?.error || "Could not resolve address. Please try again.");
    }
  };

  return (
    <View className="mx-6 my-10 p-6 bg-amber-50/50 border border-amber-100 rounded-[28px] items-center gap-y-4 shadow-sm">
      <View className="w-16 h-16 bg-amber-100 rounded-full items-center justify-center">
        <Ionicons name="location-outline" size={32} color="#E29E10" />
      </View>

      <View className="items-center px-4">
        <Text className="text-base font-heading-semibold text-gray-900 text-center">
          Location Access Required
        </Text>
        <Text className="text-xs font-body text-gray-400 text-center mt-1.5 leading-relaxed">
          Dine Five uses your location to discover restaurants and food pickup points near you.
        </Text>
      </View>

      <View className="w-full mt-2 px-4 gap-y-3">
        <TouchableOpacity
          onPress={onEnableGPS}
          className="bg-[#E29E10] h-12 rounded-2xl flex-row items-center justify-center gap-2 shadow-sm"
        >
          <Ionicons name="pin" size={16} color="#FFF" />
          <Text className="text-white font-body-semibold text-sm">Enable Location Access</Text>
        </TouchableOpacity>

        <View className="w-full border-t border-gray-200/60 pt-3">
          <Text className="text-xs font-heading-medium text-gray-500 mb-2">
            Or enter address manually:
          </Text>
          <View className="flex-row items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3 py-1.5 shadow-sm">
            <Ionicons name="search" size={16} color="#9CA3AF" />
            <TextInput
              value={manualInput}
              onChangeText={setManualInput}
              placeholder="e.g. New York, California, 94043..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-sm text-gray-800 py-1"
            />
            {manualInput.trim().length > 0 && (
              <TouchableOpacity
                onPress={handleSet}
                disabled={loading}
                className="bg-[#E29E10] px-3.5 py-1.5 rounded-xl"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text className="text-white text-xs font-body-semibold">Set</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
