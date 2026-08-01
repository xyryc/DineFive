import { AuthComponents } from "@/components/auth/AuthComponents";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Login = () => {
  const router = useRouter();
  return (
    <View className="flex-1 bg-white">
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 items-center justify-center pt-8 pb-4 relative">
            <Image
              source={require("@/assets/images/logo.jpg")}
              contentFit="contain"
              style={{
                height: 180,
                width: 180,
              }}
            />
          </View>

          {/* Top Role Selection Pill Button */}
          <View className="px-6 pb-2 items-center">
            <TouchableOpacity
              onPress={() => router.push("/(auth)/role-selection")}
              className="bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full"
            >
              <Text className="text-xs font-body-semibold text-amber-800">
                🏪 Restaurant Owner? Tap here to Partner →
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login form */}
          <AuthComponents initialTab="login" />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Login;
