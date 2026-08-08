import { signInWithApple } from "@/services/socialAuth";
import { useStore } from "@/stores/stores";
import * as AppleAuthentication from "expo-apple-authentication";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

export default function AppleLogin() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const { appleLogin } = useStore() as any;
  const { height } = useWindowDimensions();

  const buttonHeight = Math.min(Math.max(height * 0.055, 42), 56);

  useEffect(() => {
    async function checkAvailability() {
      if (Platform.OS !== "ios") {
        setIsAvailable(false);
        return;
      }
      try {
        const available = await AppleAuthentication.isAvailableAsync();
        setIsAvailable(available);
      } catch {
        setIsAvailable(false);
      }
    }
    checkAvailability();
  }, []);

  async function handleAppleSignIn() {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const credential = await signInWithApple();
      if (!credential || !credential.identityToken) {
        throw new Error("No identity token received from Apple Sign In.");
      }

      const loginResult = await appleLogin({
        identityToken: credential.identityToken,
        fullName: credential.fullName,
      });

      if (loginResult) {
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      if (error?.code === "ERR_REQUEST_CANCELED") {
        return;
      }
      console.log("Apple Login Error:", error);
      Alert.alert("Apple Sign-In Failed", error.message || "Something went wrong.");
    } finally {
      setIsBusy(false);
    }
  }

  // Only render Apple Sign-In button on iOS devices where Apple Auth is supported
  if (!isAvailable) {
    return null;
  }

  return (
    <View style={styles.outerContainer}>
      {isBusy ? (
        <View style={[styles.loadingContainer, { height: buttonHeight }]}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={16}
          style={{ width: "100%", height: buttonHeight }}
          onPress={handleAppleSignIn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: "100%",
    marginTop: 10,
  },
  loadingContainer: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
});
