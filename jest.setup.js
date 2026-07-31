/* eslint-disable no-undef */

// Define global _ReactNativeCSSInterop variable for NativeWind v4 in Jest
global._ReactNativeCSSInterop = {
  cssInterop: () => {},
  remapProps: () => {},
  maybeHijackSafeAreaProvider: (type: any) => type,
};

// Mock Expo Constants
jest.mock("expo-constants", () => ({
  expoConfig: {
    hostUri: "localhost:8081",
  },
}));

// Mock Expo Linear Gradient
jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

// Mock Expo Vector Icons
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
  FontAwesome: "FontAwesome",
}));
