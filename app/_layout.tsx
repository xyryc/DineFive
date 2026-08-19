import * as Sentry from "@sentry/react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { useFonts } from "expo-font";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { useNotificationSync } from "@/hooks/useNotificationSync";
import { useStore } from "@/stores/stores";
import "../global.css";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  enableLogs: true,
  enableNative: !__DEV__,
  // Set debug to true (or __DEV__) for verbose sentry terminal debugging
  debug: false,
});

// Suppress Reanimated strict-mode warnings that come from third-party dependencies
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayout() {
  const isInitialized = useStore((state: any) => state.isInitialized);
  const initializeAuth = useStore((state: any) => state.initializeAuth);
  const accessToken = useStore((state: any) => state.accessToken);
  const user = useStore((state: any) => state.user);
  const segments = useSegments();
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    "PlusJakartaSans-Light": require("@/assets/fonts/PlusJakartaSans-Light.ttf"),
    "PlusJakartaSans-Regular": require("@/assets/fonts/PlusJakartaSans-Regular.ttf"),
    "PlusJakartaSans-Medium": require("@/assets/fonts/PlusJakartaSans-Medium.ttf"),
    "PlusJakartaSans-SemiBold": require("@/assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "PlusJakartaSans-Bold": require("@/assets/fonts/PlusJakartaSans-Bold.ttf"),
    "PlusJakartaSans-ExtraBold": require("@/assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "InstrumentSans-Regular": require("@/assets/fonts/InstrumentSans-Regular.ttf"),
    "InstrumentSans-Medium": require("@/assets/fonts/InstrumentSans-Medium.ttf"),
    "InstrumentSans-SemiBold": require("@/assets/fonts/InstrumentSans-SemiBold.ttf"),
    "InstrumentSans-Bold": require("@/assets/fonts/InstrumentSans-Bold.ttf"),
  });

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isInitialized, fontsLoaded]);

  const isGuest = useStore((state: any) => state.isGuest);

  useEffect(() => {
    const group = segments[0] as string;

    const inAuthGroup = group === "(auth)";
    const inOnboarding = group === "onboarding";
    const inTabsGroup = group === "(tabs)";
    const inScreensGroup = group === "screens";
    const isPendingVerification = Boolean(
      accessToken && user && user.isVerified === false,
    );

    if (!isInitialized || !fontsLoaded) return;

    if (isPendingVerification) {
      if (inTabsGroup || inScreensGroup || inOnboarding) {
        router.replace({
          pathname: "/(auth)/verify-otp",
          params: { email: user?.email },
        });
      }
      return;
    }

    if (!accessToken && !isGuest) {
      if (inTabsGroup || inScreensGroup) {
        router.replace("/(auth)/login");
      }
    } else {
      if (!isGuest && (inAuthGroup || inOnboarding)) {
        router.replace("/(tabs)");
      }
    }
  }, [accessToken, fontsLoaded, isGuest, isInitialized, router, segments, user]);

  useNotificationSync();

  if (!isInitialized || !fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="screens" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default Sentry.wrap(RootLayout);
