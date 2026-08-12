import GradientButton from "@/components/common/GradientButton";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StatusBar,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STEPS = [
  {
    id: "1",
    image: require("@/assets/images/1.jpg"),
    title: "Fresh Meals for Just $5.99",
    description:
      "Beat the rising cost of dining out. Enjoy hot, freshly prepared cheesy pizzas and local favorites for just $5.99—without the markup.",
    buttonTitle: "Explore Meals",
  },
  {
    id: "2",
    image: require("@/assets/images/2.jpg"),
    title: "Fast & Convenient Pickup",
    description:
      "No long waits or high delivery fees. Reserve your $5.99 meal on the app and pick it up hot & fresh right from your favorite local spots.",
    buttonTitle: "See How It Works",
  },
  {
    id: "3",
    image: require("@/assets/images/3.jpg"),
    title: "Beer, Wine & Perfect Pairings",
    description:
      "Complete your meal with ice-cold craft beers, fine wines, and artisan beverages. Elevate your dining experience at unbeatable value.",
    buttonTitle: "See Pairings",
  },
  {
    id: "4",
    image: require("@/assets/images/4.jpg"),
    title: "Gourmet Dishes Made Daily",
    description:
      "From artisan sandwiches & fresh garden salads to rich dinners, savor restaurant-quality cuisine prepared daily by expert local chefs.",
    buttonTitle: "Get Started",
  },
];

const OnboardingScreen = () => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [scrollX] = useState(() => new Animated.Value(0));
  const [activeIndex, setActiveIndex] = useState(0);

  const bottomSectionHeight = height * 0.4;
  const topSectionHeight = height - bottomSectionHeight;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slideIndex = Math.round(
          event.nativeEvent.contentOffset.x / width
        );
        if (
          slideIndex !== activeIndex &&
          slideIndex >= 0 &&
          slideIndex < STEPS.length
        ) {
          setActiveIndex(slideIndex);
        }
      },
    }
  );

  const handleNext = () => {
    if (activeIndex < STEPS.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    } else {
      router.replace("/(auth)/role-selection");
    }
  };

  const handleSkip = () => {
    router.replace("/(auth)/role-selection");
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />

      {/* Top Section: Swipable Hero Images */}
      <View style={{ height: topSectionHeight }} className="w-full relative">
        <FlatList
          ref={flatListRef}
          data={STEPS}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          renderItem={({ item }) => (
            <View style={{ width, height: topSectionHeight }} className="flex-1 bg-black">
              <ImageBackground
                source={item.image}
                resizeMode="cover"
                className="flex-1"
              />
            </View>
          )}
        />

        {/* Skip button overlay - fixed top right */}
        <View
          style={{ top: Math.max(insets.top, 20) }}
          className="absolute right-4 z-20"
        >
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
            <Text className="text-base font-body-medium text-[#FFCD39]">
              Skip
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Section: Persistent Fixed White Card */}
      <View
        style={{
          height: bottomSectionHeight,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 24,
        }}
        className="bg-white px-6 pt-8 justify-between"
      >
        {/* Persistent Indicator Dots */}
        <View className="flex-row justify-center gap-2 mb-4">
          {STEPS.map((_, dotIdx) => {
            const inputRange = [
              (dotIdx - 1) * width,
              dotIdx * width,
              (dotIdx + 1) * width,
            ];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [24, 40, 24],
              extrapolate: "clamp",
            });

            const backgroundColor = scrollX.interpolate({
              inputRange,
              outputRange: ["#E5E7EB", "#FFCD39", "#E5E7EB"],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={dotIdx}
                style={{
                  height: 8,
                  width: dotWidth,
                  backgroundColor,
                  borderRadius: 9999,
                }}
              />
            );
          })}
        </View>

        {/* Dynamic Title & Description - Smooth In-Place Cross-Fade */}
        <View className="flex-1 justify-center items-center">
          {STEPS.map((step, idx) => {
            const opacity = scrollX.interpolate({
              inputRange: [
                (idx - 0.75) * width,
                idx * width,
                (idx + 0.75) * width,
              ],
              outputRange: [0, 1, 0],
              extrapolate: "clamp",
            });

            const translateY = scrollX.interpolate({
              inputRange: [
                (idx - 1) * width,
                idx * width,
                (idx + 1) * width,
              ],
              outputRange: [6, 0, -6],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={step.id}
                style={{
                  position: "absolute",
                  opacity,
                  transform: [{ translateY }],
                  alignItems: "center",
                  width: "100%",
                }}
                pointerEvents={idx === activeIndex ? "auto" : "none"}
              >
                {/* Title */}
                <Text
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  className="text-3xl font-heading text-gray-900 mb-3 text-center"
                >
                  {step.title}
                </Text>

                {/* Description */}
                <Text className="text-base text-gray-600 leading-relaxed text-center">
                  {step.description}
                </Text>
              </Animated.View>
            );
          })}
        </View>

        {/* Action Button - Locked in place at bottom */}
        <View className="mt-auto w-full pt-4">
          <GradientButton
            title={STEPS[activeIndex].buttonTitle}
            onPress={handleNext}
            className="w-full"
          />
        </View>
      </View>
    </View>
  );
};

export default OnboardingScreen;
