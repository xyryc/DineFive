import React from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Return true on success so the modal closes itself */
  onConfirm: (address: string) => Promise<boolean>;
};

export default function AddressModal({ visible, onClose, onConfirm }: Props) {
  const [address, setAddress] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSearch = async () => {
    if (!address.trim()) return;
    setLoading(true);
    const success = await onConfirm(address);
    setLoading(false);
    if (success) {
      setAddress("");
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        <View className="bg-white rounded-[28px] w-full p-6 shadow-xl gap-y-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-heading text-gray-900">Set Location</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <Text className="text-xs font-body text-gray-400 leading-relaxed">
            Enter your address, city, or zip code to find nearby restaurants:
          </Text>

          <View className="flex-row items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2">
            <Ionicons name="location-outline" size={18} color="#9CA3AF" />
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. New York, Dhaka..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-sm text-gray-800 py-1"
              autoFocus
            />
          </View>

          <View className="flex-row gap-3 mt-2">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 bg-gray-50 border border-gray-200/60 h-12 rounded-2xl items-center justify-center"
            >
              <Text className="text-gray-500 font-body-semibold text-sm">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSearch}
              disabled={loading || !address.trim()}
              className={`flex-1 bg-[#E29E10] h-12 rounded-2xl items-center justify-center ${
                loading || !address.trim() ? "opacity-60" : ""
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text className="text-white font-body-semibold text-sm">Search</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
