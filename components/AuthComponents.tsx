import { useStore } from "@/stores/stores";
import { Ionicons } from "@expo/vector-icons";
import { Checkbox, Host } from "@expo/ui";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CustomInput from "./CustomInput";
import GoogleLogin from "./GoogleLogin";
import GradientButton from "./GradientButton";
import TermsModal, { preloadLegalDocuments } from "./TermsModal";

interface AuthComponentsProps {
  initialTab?: "login" | "signup";
}

export const AuthComponents = ({
  initialTab = "login",
}: AuthComponentsProps) => {
  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab);
  const [cardWidth, setCardWidth] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    preloadLegalDocuments();
  }, []);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoginShowPassword, setIsLoginShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Signup form state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [isSignupShowPassword, setIsSignupShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"terms" | "privacy">("terms");
  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);

  const openModal = (type: "terms" | "privacy") => {
    setModalType(type);
    setModalVisible(true);
  };

  const { login, signup } = useStore() as any;

  const handleTabSwitch = (tab: "login" | "signup") => {
    if (activeTab === tab) return;
    setActiveTab(tab);

    const targetX = tab === "signup" ? cardWidth : 0;
    scrollViewRef.current?.scrollTo({ x: targetX, animated: true });
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width - 40; // Subtract padding px-5 (20px left + 20px right)
    if (width > 0 && width !== cardWidth) {
      setCardWidth(width);
      if (initialTab === "signup") {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ x: width, animated: false });
        }, 50);
      }
    }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setIsSubmittingLogin(true);
    try {
      const result = await login({ email: loginEmail, password: loginPassword });
      if (result) {
        router.replace("/(tabs)");
      } else {
        Alert.alert("Error", "Login failed. Please check your credentials.");
      }
    } catch (error: any) {
      console.log("Login error:", error);
      if (error.message?.includes("verify your email")) {
        Alert.alert(
          "Verification Required",
          "Please verify your email address before logging in.",
          [
            {
              text: "Verify Now",
              onPress: () =>
                router.push({
                  pathname: "/(auth)/verify-otp",
                  params: { email: loginEmail },
                }),
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
      } else {
        Alert.alert("Error", error.message || "An unexpected error occurred.");
      }
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleSignup = async () => {
    if (!signupName || !signupEmail || !signupPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (!agree) {
      Alert.alert("Error", "Please agree to the Terms and Conditions.");
      return;
    }

    setIsSubmittingSignup(true);
    try {
      const result = await signup({
        fullName: signupName,
        email: signupEmail,
        password: signupPassword,
        role: "CUSTOMER",
      });
      console.log("Signup result:", result);
      if (result) {
        router.push({
          pathname: "/(auth)/verify-otp",
          params: { email: signupEmail },
        });
      } else {
        Alert.alert("Error", "Signup failed. Please try again.");
      }
    } catch (error: any) {
      console.log("Signup error:", error);
      Alert.alert("Error", error.message || "An unexpected error occurred.");
    } finally {
      setIsSubmittingSignup(false);
    }
  };

  return (
    <View
      onLayout={handleLayout}
      className="pt-5 px-5 pb-10 bg-white rounded-t-3xl shadow-lg"
    >
      {/* Tab Selector */}
      <View className="flex-row items-center gap-5 bg-[#FFF3CD] rounded-2xl mb-4">
        {activeTab === "login" ? (
          <>
            <GradientButton title="Login" className="w-1/2" />
            <TouchableOpacity
              onPress={() => handleTabSwitch("signup")}
              className="flex-1"
            >
              <Text className="font-body-bold text-[#91958E] py-4 text-center">
                Sign Up
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => handleTabSwitch("login")}
              className="flex-1"
            >
              <Text className="font-body-bold text-[#91958E] py-4 text-center">
                Login
              </Text>
            </TouchableOpacity>
            <GradientButton title="Sign Up" className="w-1/2" />
          </>
        )}
      </View>

      {/* Horizontal Sliding Form Pager (Top App Standard) */}
      {cardWidth > 0 ? (
        <View style={{ width: cardWidth }} className="overflow-hidden bg-white">
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            style={{ width: cardWidth }}
            className="bg-white overflow-hidden"
          >
            {/* LOGIN FORM */}
            <View style={{ width: cardWidth }} className="bg-white">
              <CustomInput
                label="Email"
                className="mt-1"
                placeholder="name@example.com"
                onChangeText={(text) => setLoginEmail(text)}
                value={loginEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <CustomInput
                label="Password"
                className="mt-5"
                placeholder="min. 6 characters"
                onChangeText={(text) => setLoginPassword(text)}
                value={loginPassword}
                secureTextEntry={!isLoginShowPassword}
                icon={
                  <TouchableOpacity
                    onPress={() => setIsLoginShowPassword(!isLoginShowPassword)}
                  >
                    {isLoginShowPassword ? (
                      <Ionicons name="eye-outline" size={24} color="black" />
                    ) : (
                      <Ionicons name="eye-off-outline" size={24} color="black" />
                    )}
                  </TouchableOpacity>
                }
              />

              <View className="mt-3 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Host style={{ width: 24, height: 24 }}>
                    <Checkbox
                      value={rememberMe}
                      onValueChange={setRememberMe}
                    />
                  </Host>
                  <Text
                    onPress={() => setRememberMe(!rememberMe)}
                    className="ml-2 text-[#1F2A33] font-body-medium text-sm"
                  >
                    Remember me
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => router.push("/(auth)/forgot-password")}
                >
                  <Text className="text-[#D32F1E] font-body-medium text-sm">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="mt-7">
                {isSubmittingLogin ? (
                  <View className="items-center py-4 bg-yellow-400 rounded-full">
                    <ActivityIndicator color="black" />
                  </View>
                ) : (
                  <GradientButton title="Login" onPress={handleLogin} />
                )}
              </View>
            </View>

            {/* SIGNUP FORM */}
            <View style={{ width: cardWidth }} className="bg-white">
              <CustomInput
                label="Name"
                className="mt-1"
                placeholder="Your full name"
                onChangeText={(text) => setSignupName(text)}
                value={signupName}
              />

              <CustomInput
                label="Email"
                className="mt-4"
                placeholder="name@example.com"
                onChangeText={(text) => setSignupEmail(text)}
                value={signupEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <CustomInput
                label="Password"
                className="mt-4"
                placeholder="min. 6 characters"
                onChangeText={(text) => setSignupPassword(text)}
                value={signupPassword}
                secureTextEntry={!isSignupShowPassword}
                icon={
                  <TouchableOpacity
                    onPress={() => setIsSignupShowPassword(!isSignupShowPassword)}
                  >
                    {isSignupShowPassword ? (
                      <Ionicons name="eye-outline" size={24} color="black" />
                    ) : (
                      <Ionicons name="eye-off-outline" size={24} color="black" />
                    )}
                  </TouchableOpacity>
                }
              />

              <TermsModal
                visible={modalVisible}
                type={modalType}
                onClose={() => setModalVisible(false)}
              />

              <View className="mt-3 flex-row items-center">
                <Host style={{ width: 24, height: 24 }}>
                  <Checkbox
                    value={agree}
                    onValueChange={setAgree}
                  />
                </Host>
                <Text className="ml-2 text-[#1F2A33] font-body-medium text-sm flex-1">
                  I agree to our{" "}
                  <Text
                    className="text-[#D32F1E] underline"
                    onPress={() => openModal("terms")}
                  >
                    Terms & Conditions
                  </Text>{" "}
                  and{" "}
                  <Text
                    className="text-[#D32F1E] underline"
                    onPress={() => openModal("privacy")}
                  >
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </View>

              <View className="mt-7">
                {isSubmittingSignup ? (
                  <View className="items-center py-4 bg-yellow-400 rounded-full">
                    <ActivityIndicator color="black" />
                  </View>
                ) : (
                  <GradientButton title="Sign up" onPress={handleSignup} />
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      ) : null}

      {/* Divider */}
      <View className="mt-4 flex-row items-center gap-3">
        <View className="h-px bg-[#EDEDED] mx-2 flex-1" />
        <Text className="text-[#8E8E8E] text-base">or</Text>
        <View className="flex-1 h-px bg-[#EDEDED] mx-2" />
      </View>

      {/* Google Login */}
      <GoogleLogin />

      {/* Restaurant Partner Dashboard Link */}
      <View className="mt-6 items-center">
        <Text className="text-xs font-body-medium text-[#6C757D]">
          Are you a restaurant partner?{" "}
          <Text
            className="text-[#E29E10] font-body-bold underline"
            onPress={() => Linking.openURL("https://restaurant.dinefive.com")}
          >
            Go to Partner Dashboard
          </Text>
        </Text>
      </View>
    </View>
  );
};

export default AuthComponents;
