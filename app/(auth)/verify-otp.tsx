import CustomInput from "@/components/auth/CustomInput";
import GradientButton from "@/components/common/GradientButton";
import { useStore } from "@/stores/stores";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  View,
  KeyboardAvoidingView,
} from "react-native";

const VerifyOTP = () => {
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = useMemo(() => {
    const value = params.email;
    return Array.isArray(value) ? value[0] : value;
  }, [params.email]);
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { verifyOTP } = useStore() as any;

  const handleVerifyOTP = async () => {
    if (!email) {
      Alert.alert(
        "Missing email",
        "We could not verify this account because the email address is missing.",
        [{ text: "Back to signup", onPress: () => router.replace("/(auth)/signup") }],
      );
      return;
    }

    if (!code || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Verifying OTP for:", email, "with code:", code);
      const result = await verifyOTP({ email, code });
      console.log("Verification result:", JSON.stringify(result, null, 2));

      const { user, accessToken } = useStore.getState() as any;
      console.log("Auth state after verification:", { user, accessToken });

      if (result?.success) {
        if (user && accessToken) {
          router.replace("/(tabs)");
        } else {
          router.replace("/(auth)/login");
        }
      } else {
        console.log("Invalid OTP");
      }
    } catch (error: any) {
      console.log("Verification error:", error);
    } finally {
      setIsSubmitting(false);
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
                Enter Verification OTP
              </Text>
              <Text className="text-gray-600 text-center mb-2">
                We have sent a verification code to:
              </Text>
              <Text className="text-gray-900 font-body-bold text-center mb-6">
                {email || "your email address"}
              </Text>

              {/* OTP Input Fields */}
              <CustomInput
                label="Enter Verification Code"
                className="mt-2"
                placeholder="123456"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
              />

              {/* Verify button */}
              <View className="mt-14 mb-4">
                {isSubmitting ? (
                  <View className="items-center py-4 bg-yellow-400 rounded-full">
                    <ActivityIndicator color="black" />
                  </View>
                ) : (
                  <GradientButton title="Verify" onPress={handleVerifyOTP} />
                )}
              </View>
            </View>
          </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default VerifyOTP;
