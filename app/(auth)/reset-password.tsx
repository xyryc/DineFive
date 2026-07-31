import CustomInput from "@/components/auth/CustomInput";
import GradientButton from "@/components/common/GradientButton";
import { useStore } from "@/stores/stores";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

const ResetPassword = () => {
  const { email } = useLocalSearchParams<{
    email: string;
  }>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { resetPassword, isLoading } = useStore() as any;

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      console.log("Resetting password for:", email);
      const result = await resetPassword({
        newPassword,
        confirmPassword,
      });

      if (result) {
        Alert.alert("Success", "Password reset successfully!", [
          { text: "OK", onPress: () => router.replace("/(auth)/login") },
        ]);
      } else {
        const storeError = (useStore.getState() as any).error;
        Alert.alert("Error", String(storeError || "Failed to reset password"));
      }
    } catch (error: any) {
      console.log("Reset Password error:", error);
      Alert.alert("Error", String(error.message || "Something went wrong"));
    }
  };

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
            <View className="flex-1 items-center justify-center py-10">
              <Image
                source={require("@/assets/images/logo.jpg")}
                contentFit="contain"
                style={{
                  height: 200,
                  width: 200,
                  backgroundColor: "#00000010",
                  paddingBottom: 5,
                  borderRadius: 100,
                }}
              />
            </View>

            <View
              className="bg-white pt-8 px-6 pb-10 rounded-t-3xl"
              style={{
                borderTopWidth: 2,
                borderLeftWidth: 2,
                borderRightWidth: 2,
                borderColor: "#F59E0B",
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
              }}
            >
              <Text className="text-2xl font-heading text-center mb-4">
                Now Reset Your Password.
              </Text>
              <Text className="text-gray-600 text-center mb-6">
                Password must have 6-8 characters.
              </Text>

              {/* New Password Input */}
              <CustomInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry={!showPassword}
                className="mb-4"
                icon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <Ionicons name="eye-outline" size={24} color="black" />
                    ) : (
                      <Ionicons name="eye-off-outline" size={24} color="black" />
                    )}
                  </TouchableOpacity>
                }
              />

              {/* Confirm Password Input */}
              <CustomInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry={!showConfirmPassword}
                className="mb-6"
                icon={
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (
                      <Ionicons name="eye-outline" size={24} color="black" />
                    ) : (
                      <Ionicons name="eye-off-outline" size={24} color="black" />
                    )}
                  </TouchableOpacity>
                }
              />

              {/* Reset button */}
              <View className="mt-14 mb-4">
                {isLoading ? (
                  <View className="items-center py-4 bg-yellow-400 rounded-full">
                    <ActivityIndicator color="black" />
                  </View>
                ) : (
                  <GradientButton
                    title="Reset Password"
                    onPress={handleResetPassword}
                  />
                )}
              </View>
            </View>
          </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ResetPassword;
