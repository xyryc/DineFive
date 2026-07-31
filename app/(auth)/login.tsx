import { AuthComponents } from "@/components/auth/AuthComponents";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";

const Login = () => {
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
                paddingBottom: 5,
              }}
            />
          </View>
          {/* Login form */}
          <AuthComponents initialTab="login" />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Login;
