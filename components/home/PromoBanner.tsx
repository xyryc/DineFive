import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_WIDTH = SCREEN_WIDTH - 32;

const FALLBACK_IMAGE = require("@/assets/images/burger-wide.jpg");

export type BannerItem = {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  image?: any;
};

type PromoBannerProps = {
  banners?: BannerItem[];
  deals?: BannerItem[];
};

const DEFAULT_BANNER: BannerItem = {
  title: "Welcome to Dine Five!",
  image: FALLBACK_IMAGE,
};

const BannerSlide = ({
  item,
  onPress,
}: {
  item: BannerItem;
  onPress: () => void;
}) => {
  const [hasError, setHasError] = useState(false);

  const title = item?.title?.trim() || DEFAULT_BANNER.title;
  const rawImage = item?.image;

  const imageSource = React.useMemo(() => {
    if (hasError || !rawImage) return FALLBACK_IMAGE;
    if (typeof rawImage === "number") return rawImage;
    if (typeof rawImage === "string") {
      const trimmed = rawImage.trim();
      if (!trimmed || trimmed === "null" || trimmed === "undefined") {
        return FALLBACK_IMAGE;
      }
      if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("file://") ||
        trimmed.startsWith("data:")
      ) {
        return { uri: trimmed };
      }
    }
    return FALLBACK_IMAGE;
  }, [rawImage, hasError]);

  return (
    <View style={{ width: BANNER_WIDTH, paddingHorizontal: 6 }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        className="rounded-3xl h-[190px] overflow-hidden p-5 relative shadow-md shadow-black/15 bg-gray-900"
      >
        {/* Full-Cover Background Image with Automatic Fallback */}
        <Image
          source={imageSource}
          placeholder={FALLBACK_IMAGE}
          placeholderContentFit="cover"
          onError={() => setHasError(true)}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
        />

        {/* Subtle Multi-Stop Gradient Scrim for crisp legibility */}
        <LinearGradient
          colors={["rgba(0,0,0,0.78)", "rgba(0,0,0,0.40)", "rgba(0,0,0,0.05)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 0.8 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Top-Left Promotional Text */}
        <View className="z-10 items-start max-w-[85%]">
          <Text
            className="text-white text-[20px] font-heading leading-tight tracking-tight"
            numberOfLines={3}
            style={{
              textShadowColor: "rgba(0, 0, 0, 0.6)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }}
          >
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export const PromoBanner = ({ banners, deals }: PromoBannerProps) => {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const list = React.useMemo(() => {
    const rawList = banners ?? deals ?? [];
    const filtered = Array.isArray(rawList) ? rawList.filter(Boolean) : [];
    return filtered.length > 0 ? filtered : [DEFAULT_BANNER];
  }, [banners, deals]);

  const extendedList = React.useMemo(() => {
    if (list.length <= 1) return list;
    return [list[list.length - 1], ...list, list[0]];
  }, [list]);

  useEffect(() => {
    if (list.length > 1) {
      const timer = setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            x: BANNER_WIDTH,
            animated: false,
          });
          setIsInitialized(true);
          setActiveIndex(0);
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsInitialized(true);
      setActiveIndex(0);
    }
  }, [list]);

  useEffect(() => {
    if (list.length <= 1 || !isInitialized) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const nextScrollIndex = activeIndex + 2;
        scrollRef.current.scrollTo({
          x: nextScrollIndex * BANNER_WIDTH,
          animated: true,
        });
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [activeIndex, list.length, isInitialized]);

  const handleMomentumScrollEnd = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const scrollIndex = Math.round(x / BANNER_WIDTH);
    let newIndex = scrollIndex - 1;

    if (list.length > 1) {
      if (scrollIndex >= list.length + 1) {
        scrollRef.current?.scrollTo({ x: BANNER_WIDTH, animated: false });
        newIndex = 0;
      } else if (scrollIndex <= 0) {
        scrollRef.current?.scrollTo({
          x: list.length * BANNER_WIDTH,
          animated: false,
        });
        newIndex = list.length - 1;
      }
    } else {
      newIndex = 0;
    }

    setActiveIndex(newIndex);
  };

  return (
    <View className="px-4 mt-4">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        bounces={false}
        contentContainerStyle={{ alignItems: "center" }}
      >
        {extendedList.map((item, index) => (
          <BannerSlide
            key={`${index}-${item?.title || index}`}
            item={item}
            onPress={() => router.push("/screens/home/all-restaurants")}
          />
        ))}
      </ScrollView>

      {list.length > 1 && (
        <View className="flex-row justify-center mt-3 gap-2">
          {list.map((_, i) => (
            <View
              key={i}
              className={`h-2 rounded-full ${
                i === activeIndex ? "w-6 bg-[#E4983A]" : "w-2 bg-gray-300"
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
};
