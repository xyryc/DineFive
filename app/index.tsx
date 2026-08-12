import { useStore } from "@/stores/stores";
import { Redirect } from "expo-router";
import React from "react";

export default function Index() {
  const isInitialized = useStore((state: any) => state.isInitialized);
  const accessToken = useStore((state: any) => state.accessToken);
  const user = useStore((state: any) => state.user);

  if (!isInitialized) return null;

  if (accessToken && user && user.isVerified === false) {
    return (
      <Redirect
        href={{
          pathname: "/(auth)/verify-otp",
          params: { email: user.email },
        }}
      />
    );
  }

  if (accessToken) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}
