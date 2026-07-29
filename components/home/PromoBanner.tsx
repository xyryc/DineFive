import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_WIDTH = SCREEN_WIDTH - 32;

export type BannerItem = {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  image?: string;
};

type PromoBannerProps = {
  banners?: BannerItem[];
  deals?: BannerItem[];
};

const DEFAULT_BANNER: BannerItem = {
  title: "Welcome to Dine Five!",
  subtitle: "Discover restaurants near you",
  ctaText: "Explore",
  image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500",
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    }, 3000);

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
        {extendedList.map((item, index) => {
          const title = item?.title || DEFAULT_BANNER.title;
          const subtitle = item?.subtitle || DEFAULT_BANNER.subtitle;
          const ctaText = item?.ctaText || DEFAULT_BANNER.ctaText;
          const image = item?.image || DEFAULT_BANNER.image;

          return (
            <View
              key={`${index}-${title}`}
              style={{ width: BANNER_WIDTH, paddingHorizontal: 6 }}
            >
              <View className="bg-[#F6D977] rounded-[28px] px-6 py-5 min-h-[125px] overflow-hidden flex-row gap-1 flex-1 shadow-sm">
                <View className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/20" />
                <View className="absolute -left-4 -bottom-4 w-16 h-16 rounded-full bg-black/5" />
                <View className="absolute right-1/4 bottom-0 w-12 h-12 rounded-full bg-white/10" />

                <View className="flex-1 z-10 justify-center">
                  <Text
                    className="text-[#3A2E00] text-[20px] font-heading leading-tight tracking-tight"
                    numberOfLines={2}
                  >
                    {title}
                  </Text>
                  <Text
                    className="text-[#5D4A00] text-[13px] font-body-medium mt-1 mb-4 opacity-80"
                    numberOfLines={2}
                  >
                    {subtitle}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => router.push("/screens/home/all-restaurants")}
                    className="bg-[#222] px-5 py-2 rounded-xl self-start shadow-sm"
                  >
                    <Text className="text-white text-[12px] font-body-semibold">
                      {ctaText}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="w-[45%] items-center justify-center relative">
                  <View className="absolute w-28 h-28 rounded-full bg-white/40 shadow-sm" />
                  <Image
                    source={{ uri: image }}
                    style={{
                      width: 140,
                      height: 140,
                      borderRadius: 24,
                      marginRight: -10,
                      transform: [{ rotate: "-4deg" }],
                    }}
                    contentFit="cover"
                    transition={400}
                    cachePolicy="memory-disk"
                  />
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {list.length > 1 && (
        <View className="flex-row justify-center mt-3 gap-2">
          {list.map((_, i) => (
            <View
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-6 bg-[#222]" : "w-2 bg-gray-300"
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
};
