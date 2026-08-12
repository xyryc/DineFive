import { Platform } from "react-native";

type GoogleModule = typeof import("@react-native-google-signin/google-signin");

let googleModulePromise: Promise<GoogleModule> | null = null;

const getGoogleModule = async () => {

  try {
    if (!googleModulePromise) {
      googleModulePromise = import("@react-native-google-signin/google-signin");
    }
    return await googleModulePromise;
  } catch (error: any) {
    if (String(error?.message || error).includes("RNGoogleSignin")) {
      throw new Error(
        "Google Sign-In native module not found. Run a dev build (e.g. `npx expo run:android`) and reopen the app.",
      );
    }
    throw error;
  }
};

const ensureConfigured = async () => {
  const mod = await getGoogleModule();
  mod.GoogleSignin.configure({
    iosClientId:
      "649475005615-luq8tb9j49f2h79923ojhg4saptm708j.apps.googleusercontent.com",
    webClientId:
      "649475005615-p6qfnn9gpktjt9inlemivc3qllmqh2ag.apps.googleusercontent.com",
    offlineAccess: true,
  });
  return mod;
};

export const signInWithGoogle = async () => {
  const { GoogleSignin, statusCodes } = await ensureConfigured();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Clear any previous session so the account chooser is fresh and stale tokens are cleared
    await GoogleSignin.signOut().catch(() => {});
    const userInfo = await GoogleSignin.signIn();
    // userInfo.idToken is what we need for the backend
    return userInfo;
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log("User cancelled the login flow");
    } else if (error.code === statusCodes.IN_PROGRESS) {
      console.log("Signing in progress");
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.log("Play services not available or outdated");
    } else {
      console.error("Google login error:", error);
    }
    throw error;
  }
};

export const signOutCurrentUser = async () => {
  try {
    const { GoogleSignin } = await ensureConfigured();
    await GoogleSignin.signOut();
  } catch (error) {
    console.error("Google sign out error:", error);
    throw error;
  }
};

export const isAppleAuthAvailable = async (): Promise<boolean> => {
  if (Platform.OS !== "ios") return false;
  try {
    const AppleAuthentication = await import("expo-apple-authentication");
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
};

export const signInWithApple = async () => {
  if (Platform.OS !== "ios") {
    throw new Error("Sign in with Apple is only available on iOS devices.");
  }
  const AppleAuthentication = await import("expo-apple-authentication");
  const isAvailable = await AppleAuthentication.isAvailableAsync();
  if (!isAvailable) {
    throw new Error("Sign in with Apple is not available on this device.");
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    return credential;
  } catch (e: any) {
    if (e.code === "ERR_REQUEST_CANCELED") {
      console.log("User cancelled Apple Sign-In");
    }
    throw e;
  }
};

// Mock versions of other services mentioned in user's original code
export const signInWithFacebook = async () => {
  throw new Error("Facebook login not implemented");
};
export const signInWithTwitter = async () => {
  throw new Error("Twitter login not implemented");
};
export const observeAuthState = (callback: (user: any) => void) => {
  return () => {};
};
