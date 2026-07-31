import React from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

interface CustomInputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  className?: string;
}

const CustomInput = ({
  label,
  icon,
  leftIcon,
  className = "",
  style,
  ...props
}: CustomInputProps) => {
  return (
    <View className={className}>
      {/* Label */}
      {label && (
        <Text className="text-black font-body-medium text-sm mb-1">{label}</Text>
      )}

      {/* Input Container */}
      <View className="flex-row items-center bg-white rounded-2xl px-4 h-14 shadow-sm border border-[#8E8E8E]">
        {leftIcon && <View className="mr-3 items-center justify-center">{leftIcon}</View>}

        <View className="flex-1 h-full justify-center">
          <TextInput
            className="flex-1 text-gray-800 text-base leading-5"
            placeholderTextColor="#BEBEBE"
            style={[
              {
                paddingVertical: 0,
                textAlignVertical: "center",
                includeFontPadding: false,
              },
              style,
            ]}
            {...props}
          />
        </View>

        {/* Right Icon */}
        {icon && <View className="ml-2 items-center justify-center">{icon}</View>}
      </View>
    </View>
  );
};

export default CustomInput;
