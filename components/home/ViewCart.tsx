import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ViewCartProps {
    count: number;
    total?: number;
    bottomOffset?: number;
    onPress?: () => void;
}

export const ViewCart = ({ count, total, bottomOffset, onPress }: ViewCartProps) => {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    if (!count || count <= 0) return null;

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            router.push('/(tabs)/cart');
        }
    };

    return (
        <View
            className="absolute left-5 right-5 bg-gray-900 rounded-[24px] p-4 flex-row items-center justify-between shadow-lg z-50"
            style={{
                bottom: bottomOffset ?? Math.max(20, insets.bottom + 12),
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 15,
                elevation: 8,
            }}
        >
            <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-2xl bg-[#F5C518] items-center justify-center">
                    <Ionicons name="bag" size={20} color="#1F2937" />
                </View>
                <View>
                    <Text className="text-white font-body-bold text-sm">
                        {count} {count === 1 ? 'item' : 'items'} in bag
                    </Text>
                    <Text className="text-gray-400 text-xs font-body-semibold">
                        Fresh food ready for pickup
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.8}
                className="bg-[#F5C518] px-5 py-2.5 rounded-2xl"
            >
                <Text className="text-gray-900 font-body-bold text-xs">
                    View Bag
                </Text>
            </TouchableOpacity>
        </View>
    );
};
