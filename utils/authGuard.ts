import { Alert } from "react-native";
import { router } from "expo-router";
import { useStore } from "@/stores/stores";

/**
 * Checks if the user is authenticated.
 * If not, shows a clean Alert prompting them to log in or register.
 * Returns true if authenticated, false if guest/unauthenticated.
 */
export const requireAuth = (actionDescription = "continue"): boolean => {
  const { accessToken, user, isGuest } = useStore.getState() as any;
  const isAuthenticated = Boolean(accessToken && user);

  if (!isAuthenticated || isGuest) {
    Alert.alert(
      "Sign in Required",
      `Please sign in or create a free account to ${actionDescription}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign In",
          onPress: () => {
            useStore.getState().setGuestMode(false);
            router.push("/(auth)/login");
          },
        },
      ]
    );
    return false;
  }
  return true;
};
