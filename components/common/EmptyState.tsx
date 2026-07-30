import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface EmptyStateProps {
    title: string;
    message: string;
    buttonText?: string;
    onButtonPress?: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    imageSource?: any;
}

export const EmptyState = ({ title, message, buttonText, onButtonPress, icon, imageSource }: EmptyStateProps) => {
    return (
        <View className="flex-1 items-center justify-center px-10 py-10">
            {icon ? (
                <View className="w-28 h-28 bg-amber-100/60 rounded-full items-center justify-center mb-6 border border-amber-200/60 shadow-sm">
                    <Ionicons name={icon} size={54} color="#F5C518" />
                </View>
            ) : imageSource ? (
                <Image
                    source={imageSource}
                    style={{ width: 180, height: 180, marginBottom: 24 }}
                    contentFit="contain"
                />
            ) : (
                <View className="w-28 h-28 bg-amber-100/60 rounded-full items-center justify-center mb-6 border border-amber-200/60 shadow-sm">
                    <Ionicons name="basket-outline" size={54} color="#F5C518" />
                </View>
            )}

            <Text className="text-2xl font-heading text-gray-900 mb-2 text-center">{title}</Text>
            <Text className="text-gray-500 font-body text-center mb-8 leading-6 text-base">{message}</Text>

            {buttonText && (
                <TouchableOpacity
                    onPress={onButtonPress}
                    className="bg-yellow-400 px-12 py-3.5 rounded-2xl shadow-sm"
                    activeOpacity={0.85}
                >
                    <Text className="text-gray-900 font-body-bold text-base">{buttonText}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};
