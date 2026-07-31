import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useStore } from "@/stores/stores";
import { Ionicons } from "@expo/vector-icons";
import * as Sentry from "@sentry/react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MENU_ITEMS = [
  {
    id: "support",
    title: "Customer Support",
    icon: "chatbubble-outline",
    color: "#26A69A",
    bgColor: "#E0F2F1",
    route: "/screens/profile/customer-support",
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    icon: "lock-closed-outline",
    color: "#EC407A",
    bgColor: "#FCE4EC",
    route: "/screens/profile/privacy",
  },
  {
    id: "terms",
    title: "Terms & Conditions",
    icon: "document-text-outline",
    color: "#78909C",
    bgColor: "#ECEFF1",
    route: "/screens/profile/terms",
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, deleteAccount } = useStore() as any;

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: async () => {
            const success = await logout();
            if (success) {
              router.replace("/(auth)/login");
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteAccount();
            if (result && result.success) {
              Alert.alert("Success", result.message || "Account deactivated");
              router.replace("/(auth)/login");
            } else {
              const error = (useStore.getState() as any).error;
              Alert.alert("Error", error || "Failed to delete account");
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FBF9F6]" edges={["top"]}>
      <StatusBar style="dark" />

      <ScreenHeader title="Settings" icon="settings-outline" />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        className="flex-1 px-6 mt-6"
      >
        {/* General Settings */}
        <Text className="text-[11px] font-body-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
          Support & Legal
        </Text>
        <View className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm mb-6">
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => router.push(item.route as any)}
              className={`flex-row items-center justify-between p-4 ${
                index < MENU_ITEMS.length - 1 ? "border-b border-gray-50" : ""
              }`}
            >
              <View className="flex-row items-center gap-4">
                <View 
                  className="w-9 h-9 rounded-xl items-center justify-center"
                  style={{ backgroundColor: item.bgColor }}
                >
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text className="text-[15px] font-body-semibold text-gray-800">
                  {item.title}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Danger Zone */}
        <Text className="text-[11px] font-body-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
          Danger Zone
        </Text>
        <View className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm mb-10">
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-4 border-b border-gray-50"
          >
            <View className="flex-row items-center gap-4">
              <View className="w-9 h-9 rounded-xl bg-[#FFF8E7] items-center justify-center border border-[#FFE8B5]">
                <Ionicons name="log-out-outline" size={18} color="#E29E10" />
              </View>
              <Text className="text-[15px] font-body-bold text-gray-800">
                Log Out
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              // Send test logs as recommended in the Sentry dashboard setup guide
              if (Sentry.logger) {
                Sentry.logger.info("This is an info log from Dine-Five");
                Sentry.logger.warn("This is a warning log", { log_type: "test" });
                Sentry.logger.error("This is an error log");
              }
              Sentry.captureMessage("Test Sentry connection from Dine-Five!");

              Alert.alert(
                "Sentry Test Logs Sent!",
                "Sent info, warning, error & message logs to Sentry! Refresh your Sentry onboarding page to verify.",
              );
            }}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-4 border-b border-gray-50"
          >
            <View className="flex-row items-center gap-4">
              <View className="w-9 h-9 rounded-xl bg-[#EEF2FF] items-center justify-center border border-[#C7D2FE]">
                <Ionicons name="bug-outline" size={18} color="#6366F1" />
              </View>
              <Text className="text-[15px] font-body-bold text-gray-800">
                Test Sentry Integration
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center gap-4">
              <View className="w-9 h-9 rounded-xl bg-[#FFF5F5] items-center justify-center border border-[#FED7D7]">
                <Ionicons name="trash-outline" size={18} color="#E53E3E" />
              </View>
              <Text className="text-[15px] font-body-bold text-red-600">
                Delete Account
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
