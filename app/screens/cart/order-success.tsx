import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const getSearchParam = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] : value;

export default function OrderSuccessScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Get values from params
    const amountPaid = params.amount ? `$${params.amount}` : '$32.12';
    const isFreeMealSuccess = getSearchParam(params.type as string | string[]) === 'free-meal';
    const isDonationSuccess = getSearchParam(params.type as string | string[]) === 'donation';
    const freeMealName = getSearchParam(params.mealName as string | string[]) || 'Free Meal';
    const freeRestaurantName = getSearchParam(params.restaurantName as string | string[]) || 'Restaurant';
    const freeTaxPaid = getSearchParam(params.totalTax as string | string[]);
    
    const tokensCreated = Math.max(
        1,
        Math.floor(
            Number(
                getSearchParam(params.tokensCreated as string | string[]) ||
                getSearchParam(params.mealCount as string | string[]) ||
                1,
            ),
        ),
    );
    const orderIdParam = getSearchParam(params.orderId as string | string[]);
    const donationMealLabel = tokensCreated === 1 ? 'meal' : 'meals';

    const handleBackToHome = () => {
        router.dismissAll();
        router.navigate('/(tabs)');
    };

    return (
        <SafeAreaView className="flex-1 bg-[#FDFBF7] justify-between">
            <StatusBar style="dark" />

            {/* Close Button */}
            <View className="px-6 pt-4">
                <TouchableOpacity
                    onPress={handleBackToHome}
                    className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm">
                    <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View className="flex-1 items-center justify-center px-8">
                {/* Check Icon */}
                <View className="w-16 h-16 bg-green-500 rounded-full items-center justify-center mb-6">
                    <Ionicons name="checkmark" size={32} color="#fff" />
                </View>

                <Text className="text-3xl font-heading text-gray-900 text-center mb-2">
                    {isFreeMealSuccess
                        ? `Yay! Free meal order${'\n'}is confirmed.`
                        : isDonationSuccess
                        ? `Thank you! Your donation${'\n'}is complete.`
                        : `Yay! Your order${'\n'}has been placed.`}
                </Text>

                <Text className="text-gray-500 font-body text-center mb-12">
                    {isFreeMealSuccess
                        ? `Show your order ID at ${freeRestaurantName}${'\n'}for pickup.`
                        : isDonationSuccess
                        ? `${tokensCreated} ${donationMealLabel} can now help people in need.`
                        : `Your order will be ready for pickup in the${'\n'}next 30 mins`}
                </Text>

                {/* Details */}
                <View className="w-full space-y-4">
                    {isFreeMealSuccess ? (
                        <>
                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                    <Ionicons name="fast-food-outline" size={20} color="#666" style={{ marginRight: 8 }} />
                                    <Text className="text-gray-500 font-body text-base">Item</Text>
                                </View>
                                <Text className="text-gray-900 font-body-semibold text-base">{freeMealName}</Text>
                            </View>

                            <View className="flex-row justify-between items-center mt-3">
                                <View className="flex-row items-center">
                                    <Ionicons name="restaurant-outline" size={20} color="#666" style={{ marginRight: 8 }} />
                                    <Text className="text-gray-500 font-body text-base">Pickup Restaurant</Text>
                                </View>
                                <Text className="text-gray-900 font-body-semibold text-base">{freeRestaurantName}</Text>
                            </View>

                            {!!orderIdParam && (
                                <View className="flex-row justify-between items-start mt-3">
                                    <View className="flex-row items-center">
                                        <Ionicons name="receipt-outline" size={20} color="#666" style={{ marginRight: 8 }} />
                                        <Text className="text-gray-500 font-body text-base">Order ID</Text>
                                    </View>
                                    <Text className="text-gray-900 font-body-semibold text-xs text-right flex-1 ml-4" numberOfLines={2}>
                                        {orderIdParam}
                                    </Text>
                                </View>
                            )}

                            <View className="flex-row justify-between items-center mt-3">
                                <View className="flex-row items-center">
                                    <Ionicons name="card-outline" size={20} color="#666" style={{ marginRight: 8 }} />
                                    <Text className="text-gray-500 font-body text-base">Tax Paid</Text>
                                </View>
                                <Text className="text-emerald-600 font-body-semibold text-base">
                                    {freeTaxPaid && Number(freeTaxPaid) > 0 ? `$${Number(freeTaxPaid).toFixed(2)}` : 'Free ($0.00)'}
                                </Text>
                            </View>
                        </>
                    ) : isDonationSuccess ? (
                        <>
                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                    <Ionicons name="gift-outline" size={20} color="#666" style={{ marginRight: 8 }} />
                                    <Text className="text-gray-500 font-body text-base">Meal tokens</Text>
                                </View>
                                <Text className="text-gray-900 font-body-semibold text-base">{tokensCreated}</Text>
                            </View>

                            {!!orderIdParam && (
                                <View className="flex-row justify-between items-start mt-4">
                                    <View className="flex-row items-center">
                                        <Ionicons name="receipt-outline" size={20} color="#666" style={{ marginRight: 8 }} />
                                        <Text className="text-gray-500 font-body text-base">Donation ID</Text>
                                    </View>
                                    <Text className="text-gray-500 font-body text-xs text-right flex-1 ml-4" numberOfLines={2}>
                                        {orderIdParam}
                                    </Text>
                                </View>
                            )}

                            <View className="flex-row justify-between items-center mt-4">
                                <View className="flex-row items-center">
                                    <Ionicons name="card-outline" size={20} color="#666" style={{ marginRight: 8 }} />
                                    <Text className="text-gray-500 text-base">Amount Paid</Text>
                                </View>
                                <Text className="text-gray-900 font-body-bold text-base">{amountPaid}</Text>
                            </View>
                        </>
                    ) : (
                        <>
                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                    <Ionicons name="time-outline" size={20} color="#666" style={{ marginRight: 8 }} />
                                    <Text className="text-gray-500 font-body text-base">Estimated time</Text>
                                </View>
                                <Text className="text-gray-900 font-body-semibold text-base">30mins</Text>
                            </View>

                            <View className="flex-row justify-between items-center mt-4">
                                <View className="flex-row items-center">
                                    <Ionicons name="card-outline" size={20} color="#666" style={{ marginRight: 8 }} />
                                    <Text className="text-gray-500 font-body text-base">Amount Paid</Text>
                                </View>
                                <Text className="text-gray-900 font-body-semibold text-base">{amountPaid}</Text>
                            </View>
                        </>
                    )}
                </View>
            </View>

            {/* Footer */}
            <View className="px-6 pb-8">
                <TouchableOpacity
                    onPress={handleBackToHome}
                    className="bg-yellow-400 w-full py-4 rounded-2xl shadow-md items-center">
                    <Text className="text-gray-900 font-body-bold text-lg">Back to home</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
