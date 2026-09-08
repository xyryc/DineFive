import * as Sentry from "@sentry/react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { useFonts } from "expo-font";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { useNotificationSync } from "@/hooks/useNotificationSync";
import { useStore } from "@/stores/stores";
import { AnimatedSplashScreen } from "@/components/common/AnimatedSplashScreen";
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

// Keep the native splash screen visible until our animated video splash takes over
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayout() {
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);
  const isInitialized = useStore((state: any) => state.isInitialized);
  const initializeAuth = useStore((state: any) => state.initializeAuth);
  const accessToken = useStore((state: any) => state.accessToken);
  const user = useStore((state: any) => state.user);
  const fetchBanners = useStore((state: any) => state.fetchBanners);
  const fetchCategories = useStore((state: any) => state.fetchCategories);
  const fetchHomeFeed = useStore((state: any) => state.fetchHomeFeed);
  const fetchProfile = useStore((state: any) => state.fetchProfile);

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

  // Background preloading while the animated splash video plays
  useEffect(() => {
    if (isInitialized && !splashAnimationFinished) {
      Promise.allSettled([
        fetchBanners?.(),
        fetchCategories?.(),
        fetchHomeFeed?.(),
        accessToken ? fetchProfile?.() : Promise.resolve(),
      ]).catch(() => {});
    }
  }, [
    isInitialized,
    splashAnimationFinished,
    accessToken,
    fetchBanners,
    fetchCategories,
    fetchHomeFeed,
    fetchProfile,
  ]);

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

  const isAppReady = Boolean(isInitialized && fontsLoaded);

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="auto" />
      {isAppReady && (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#ffffff" },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="screens" options={{ headerShown: false }} />
        </Stack>
      )}
      {!splashAnimationFinished && (
        <AnimatedSplashScreen
          onAnimationFinish={() => setSplashAnimationFinished(true)}
          isAppReady={isAppReady}
        />
      )}
    </View>
  );
}

export default Sentry.wrap(RootLayout);
