module.exports = {
  expo: {
    name: "Dine Five",
    slug: "Dine-Five",
    version: "1.0.5",
    orientation: "portrait",
    icon: "./assets/images/app-icon.png",
    scheme: "dinefive",
    userInterfaceStyle: "automatic",
    ios: {
      bundleIdentifier: "com.dinefive.app",
      buildNumber: "6",
      supportsTablet: true,
      usesAppleSignIn: true,
      googleServicesFile: "./GoogleServices-Info.plist",
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "Allow Dine Five to use your location to find nearby restaurants, calculate delivery distance, and autofill your address.",
        NSPhotoLibraryUsageDescription:
          "Allow Dine Five to access your photo library to upload profile avatars and support attachments.",
        NSCameraUsageDescription:
          "Allow Dine Five to use your camera to take profile photos and support attachments.",
      },
    },
    android: {
      package: "com.dinefive.app",
      versionCode: 6,
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/app-icon.png",
        backgroundImage: "./assets/images/app-icon.png",
        monochromeImage: "./assets/images/app-icon.png",
      },
      googleServicesFile: "./google-services.json",
      config: {
        googleMaps: {
          apiKey:
            process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
      permissions: [
        "POST_NOTIFICATIONS",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
      ],
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
      bundler: "metro",
    },
    plugins: [
      "expo-router",
      "expo-notifications",
      "expo-apple-authentication",
      [
        "expo-image-picker",
        {
          photosPermission:
            "Allow Dine Five to access your photo library to upload profile avatars and support attachments.",
          cameraPermission:
            "Allow Dine Five to use your camera to take profile photos and support attachments.",
        },
      ],
      ["@stripe/stripe-react-native", {}],
      "@react-native-google-signin/google-signin",
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Allow Dine Five to use your location to find nearby restaurants, calculate delivery distance, and autofill your address.",
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: true,
          },
        },
      ],
      "expo-font",
      "expo-image",
      "expo-sharing",
      "expo-status-bar",
      "expo-video",
      "expo-asset",
      [
        "@sentry/react-native/expo",
        {
          organization: "xyryc",
          project: "dine-five",
          disableAutoUpload: process.env.SENTRY_AUTH_TOKEN ? false : true,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "959a0264-ad52-4a40-b156-60b13d42c868",
      },
    },
  },
};
