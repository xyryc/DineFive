import { AuthComponents } from "@/components/AuthComponents";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

const Signup = () => {
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
          {/* Signup components */}
          <AuthComponents initialTab="signup" />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Signup;
