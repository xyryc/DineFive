import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View, ViewStyle } from "react-native";

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  rightElement?: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  titleClassName?: string;
  centerTitle?: boolean;
}

export const ScreenHeader = ({
  title,
  subtitle,
  showBack = true,
  onBack,
  icon,
  iconColor = "#1F2937",
  rightElement,
  className = "",
  style,
  titleClassName = "",
  centerTitle = true,
}: ScreenHeaderProps) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View
      style={style}
      className={`flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100/50 ${className}`}
    >
      {/* Left Slot: Back Button */}
      <View className="w-10 items-start justify-center">
        {showBack ? (
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="p-1 rounded-full"
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Center Slot: Title & Subtitle */}
      <View
        className={`flex-1 flex-row items-center ${
          centerTitle ? "justify-center" : "justify-start"
        }`}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={iconColor}
            style={{ marginRight: 6 }}
          />
        )}
        <View className={centerTitle ? "items-center" : "items-start"}>
          <Text
            className={`text-lg font-heading text-gray-900 ${titleClassName}`}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-xs font-body text-gray-500" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Right Slot: Custom Action or Spacer */}
      <View className="w-10 items-end justify-center">
        {rightElement || null}
      </View>
    </View>
  );
};
