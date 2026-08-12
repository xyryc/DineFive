import GradientButton from "@/components/common/GradientButton";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL, fetchWithLogging } from "@/utils/api";

interface AdminPublicProfile {
  phone?: string;
  contact?: string;
  Support?: string;
  website?: string;
}

const styles = StyleSheet.create({
  logo: {
    width: 160,
    height: 160,
  },
});

export default function RoleSelectionScreen() {
  const router = useRouter();

  const [supportInfo, setSupportInfo] = useState<AdminPublicProfile | null>(
    null,
  );
  const [loadingSupport, setLoadingSupport] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchSupportProfile = async () => {
      try {
        setLoadingSupport(true);
        const res = await fetchWithLogging(
          `${API_BASE_URL}/api/v1/admin-public/profile`,
        );
        const json = await res.json();
        if (json?.success && json?.data && isMounted) {
          setSupportInfo(json.data);
        }
      } catch (err) {
        console.log("Failed to fetch admin public profile:", err);
      } finally {
        if (isMounted) setLoadingSupport(false);
      }
    };

    fetchSupportProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const rawPhone = supportInfo?.phone;
  const rawSupport = supportInfo?.Support;
  const rawContact = supportInfo?.contact;
  const rawWebsite = supportInfo?.website;

  const phoneDisplay = loadingSupport ? "--" : rawPhone || "--";
  const supportDisplay = loadingSupport ? "--" : rawSupport || "--";
  const contactDisplay = loadingSupport ? "--" : rawContact || "--";
  const websiteDisplay = loadingSupport ? "--" : rawWebsite || "--";

  const handleCall = () => {
    if (!rawPhone) return;
    const cleanedPhone = rawPhone.replace(/[^+\d]/g, "");
    if (cleanedPhone) {
      Linking.openURL(`tel:${cleanedPhone}`).catch(() => {});
    }
  };

  const handleSendEmail = (email?: string) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`).catch(() => {});
  };

  const handleWebsite = () => {
    if (!rawWebsite) return;
    const fullUrl = rawWebsite.startsWith("http")
      ? rawWebsite
      : `https://${rawWebsite}`;
    Linking.openURL(fullUrl).catch(() => {});
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScrollView
        contentContainerClassName="flex-grow px-5 py-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Branding */}
        <View className="items-center mt-1 mb-5">
          <Image
            source={require("@/assets/images/logo.jpg")}
            contentFit="contain"
            style={styles.logo}
          />
          <Text className="text-2xl font-bold text-gray-900 mt-1 text-center">
            Welcome to Dine Five
          </Text>
          <Text className="text-xs text-gray-500 text-center mt-1">
            Select your account type to get started
          </Text>
        </View>

        {/* Role Cards Container */}
        <View className="gap-y-4">
          {/* Card 1: Customer */}
          <View className="bg-[#FAF9F6] rounded-3xl border border-gray-200 p-4 shadow-sm">
            <View className="flex-row items-center mb-2.5">
              <View className="w-11 h-11 rounded-xl bg-amber-100 items-center justify-center mr-3">
                <Ionicons name="person-outline" size={24} color="#D97706" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900">
                  Customer / Diner
                </Text>
                <Text className="text-[11px] font-semibold text-amber-600 mt-0.5">
                  Customer Account
                </Text>
              </View>
            </View>
            <Text className="text-xs text-gray-600 leading-4 mb-3.5">
              Browse $5.99 fresh meals from top local spots, order for pickup &
              support meal donations.
            </Text>
            <GradientButton
              title="Continue as Customer"
              onPress={() => router.push("/(auth)/login")}
            />
          </View>

          {/* Card 2: Restaurant Owner */}
          <View className="bg-[#FAF9F6] rounded-3xl border border-gray-200 p-4 shadow-sm">
            <View className="flex-row items-center mb-2.5">
              <View className="w-11 h-11 rounded-xl bg-orange-100 items-center justify-center mr-3">
                <Ionicons name="restaurant-outline" size={24} color="#EA580C" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900">
                  Restaurant Owner
                </Text>
                <Text className="text-[11px] font-semibold text-orange-600 mt-0.5">
                  Partner Portal
                </Text>
              </View>
            </View>
            <Text className="text-xs text-gray-600 leading-4 mb-3.5">
              Fill off-peak hours, boost margin & generate extra revenue with
              zero menu changes.
            </Text>
            <GradientButton
              title="Restaurant Portal & Signup"
              onPress={() => router.push("/(auth)/restaurant-partner")}
            />
          </View>
        </View>

        {/* Support & Contact Section */}
        <View className="mt-5 bg-white rounded-3xl border border-gray-200 p-4 shadow-sm">
          <View className="flex-row items-center gap-x-2 mb-1">
            <Ionicons name="help-buoy-outline" size={20} color="#2563EB" />
            <Text className="text-sm font-bold text-gray-900">
              Need Help & Support?
            </Text>
            {loadingSupport && (
              <ActivityIndicator
                size="small"
                color="#2563EB"
                className="ml-1.5"
              />
            )}
          </View>
          <Text className="text-xs text-gray-500 leading-4 mb-3">
            Have questions or issues signing up to the restaurant portal? Reach
            out directly:
          </Text>

          <View className="gap-y-2">
            {/* Phone */}
            <TouchableOpacity
              className="flex-row items-center justify-between bg-gray-50 py-2.5 px-3 rounded-xl border border-gray-100"
              activeOpacity={rawPhone ? 0.7 : 1}
              disabled={!rawPhone}
              onPress={handleCall}
            >
              <View className="flex-row items-center gap-x-2">
                <Ionicons
                  name="call-outline"
                  size={16}
                  color={rawPhone ? "#2563EB" : "#9CA3AF"}
                />
                <Text
                  className={`text-xs font-semibold ${rawPhone ? "text-gray-800" : "text-gray-400"}`}
                >
                  {phoneDisplay}
                </Text>
              </View>
              {Boolean(rawPhone) && (
                <Text className="text-[11px] font-bold text-blue-600">
                  Call
                </Text>
              )}
            </TouchableOpacity>

            {/* Support Email */}
            <TouchableOpacity
              className="flex-row items-center justify-between bg-gray-50 py-2.5 px-3 rounded-xl border border-gray-100"
              activeOpacity={rawSupport ? 0.7 : 1}
              disabled={!rawSupport}
              onPress={() => handleSendEmail(rawSupport)}
            >
              <View className="flex-row items-center gap-x-2">
                <Ionicons
                  name="mail-outline"
                  size={16}
                  color={rawSupport ? "#2563EB" : "#9CA3AF"}
                />
                <Text
                  className={`text-xs font-semibold ${rawSupport ? "text-gray-800" : "text-gray-400"}`}
                >
                  {supportDisplay}
                </Text>
              </View>
              {Boolean(rawSupport) && (
                <Text className="text-[11px] font-bold text-blue-600">
                  Email
                </Text>
              )}
            </TouchableOpacity>

            {/* Contact Email */}
            <TouchableOpacity
              className="flex-row items-center justify-between bg-gray-50 py-2.5 px-3 rounded-xl border border-gray-100"
              activeOpacity={rawContact ? 0.7 : 1}
              disabled={!rawContact}
              onPress={() => handleSendEmail(rawContact)}
            >
              <View className="flex-row items-center gap-x-2">
                <Ionicons
                  name="mail-unread-outline"
                  size={16}
                  color={rawContact ? "#2563EB" : "#9CA3AF"}
                />
                <Text
                  className={`text-xs font-semibold ${rawContact ? "text-gray-800" : "text-gray-400"}`}
                >
                  {contactDisplay}
                </Text>
              </View>
              {Boolean(rawContact) && (
                <Text className="text-[11px] font-bold text-blue-600">
                  Email
                </Text>
              )}
            </TouchableOpacity>

            {/* Website */}
            <TouchableOpacity
              className="flex-row items-center justify-between bg-gray-50 py-2.5 px-3 rounded-xl border border-gray-100"
              activeOpacity={rawWebsite ? 0.7 : 1}
              disabled={!rawWebsite}
              onPress={handleWebsite}
            >
              <View className="flex-row items-center gap-x-2">
                <Ionicons
                  name="globe-outline"
                  size={16}
                  color={rawWebsite ? "#2563EB" : "#9CA3AF"}
                />
                <Text
                  className={`text-xs font-semibold ${rawWebsite ? "text-gray-800" : "text-gray-400"}`}
                >
                  {websiteDisplay}
                </Text>
              </View>
              {Boolean(rawWebsite) && (
                <Text className="text-[11px] font-bold text-blue-600">
                  Visit
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <Text className="text-[11px] text-gray-400 text-center mt-5 mb-2">
          © 2026 DineFive LLC
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
