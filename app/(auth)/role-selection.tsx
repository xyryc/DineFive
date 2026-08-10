import GradientButton from "@/components/common/GradientButton";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RoleSelectionScreen() {
  const router = useRouter();

  const handleCall = () => {
    Linking.openURL("tel:+18582804156").catch(() => {});
  };

  const handleEmail = () => {
    Linking.openURL("mailto:support@dinefive.com").catch(() => {});
  };

  const handleWebsite = () => {
    Linking.openURL("https://dinefive.com").catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Branding */}
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/logo.jpg")}
            contentFit="contain"
            style={styles.logo}
          />
          <Text style={styles.headerTitle}>Welcome to Dine Five</Text>
          <Text style={styles.headerSubtitle}>
            Select your account type to get started
          </Text>
        </View>

        {/* Role Cards Container */}
        <View style={styles.cardsContainer}>
          {/* Card 1: Customer */}
          <View style={styles.roleCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBadgeAmber}>
                <Ionicons name="person-outline" size={24} color="#D97706" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Customer / Diner</Text>
                <Text style={styles.cardBadgeText}>Customer Account</Text>
              </View>
            </View>
            <Text style={styles.cardDescription}>
              Browse $5.99 fresh meals from top local spots, order for pickup &
              support meal donations.
            </Text>
            <GradientButton
              title="Continue as Customer"
              onPress={() => router.push("/(auth)/login")}
            />
          </View>

          {/* Card 2: Restaurant Owner */}
          <View style={styles.roleCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBadgeOrange}>
                <Ionicons name="restaurant-outline" size={24} color="#EA580C" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Restaurant Owner</Text>
                <Text style={styles.cardBadgeTextOrange}>Partner Portal</Text>
              </View>
            </View>
            <Text style={styles.cardDescription}>
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
        <View style={styles.supportCard}>
          <View style={styles.supportHeader}>
            <Ionicons name="help-buoy-outline" size={20} color="#2563EB" />
            <Text style={styles.supportTitle}>Need Help & Support?</Text>
          </View>
          <Text style={styles.supportSubtitle}>
            Have questions or issues signing up to the restaurant portal? Reach
            out directly:
          </Text>

          <View style={styles.contactList}>
            {/* Call */}
            <TouchableOpacity
              style={styles.contactItem}
              activeOpacity={0.7}
              onPress={handleCall}
            >
              <View style={styles.contactLeft}>
                <Ionicons name="call-outline" size={16} color="#2563EB" />
                <Text style={styles.contactText}>+1 (858) 280-4156</Text>
              </View>
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>

            {/* Email */}
            <TouchableOpacity
              style={styles.contactItem}
              activeOpacity={0.7}
              onPress={handleEmail}
            >
              <View style={styles.contactLeft}>
                <Ionicons name="mail-outline" size={16} color="#2563EB" />
                <Text style={styles.contactText}>support@dinefive.com</Text>
              </View>
              <Text style={styles.actionText}>Email</Text>
            </TouchableOpacity>

            {/* Website */}
            <TouchableOpacity
              style={styles.contactItem}
              activeOpacity={0.7}
              onPress={handleWebsite}
            >
              <View style={styles.contactLeft}>
                <Ionicons name="globe-outline" size={16} color="#2563EB" />
                <Text style={styles.contactText}>https://dinefive.com</Text>
              </View>
              <Text style={styles.actionText}>Visit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>© 2026 DineFive LLC</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    alignItems: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  logo: {
    width: 110,
    height: 110,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
  cardsContainer: {
    rowGap: 16,
  },
  roleCard: {
    backgroundColor: "#FAF9F6",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  iconBadgeAmber: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconBadgeOrange: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  cardBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#D97706",
    marginTop: 1,
  },
  cardBadgeTextOrange: {
    fontSize: 11,
    fontWeight: "600",
    color: "#EA580C",
    marginTop: 1,
  },
  cardDescription: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
    marginBottom: 14,
  },
  supportCard: {
    marginTop: 22,
    backgroundColor: "#FFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  supportHeader: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
    marginBottom: 4,
  },
  supportTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  supportSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
    marginBottom: 12,
  },
  contactList: {
    rowGap: 8,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  contactLeft: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
  },
  contactText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
  },
  actionText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  footerText: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 8,
  },
});
