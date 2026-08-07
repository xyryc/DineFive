import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { FreeMealTaxCheckoutModal } from "@/components/home/FreeMealTaxCheckoutModal";

// Mock dependencies
jest.mock("@stripe/stripe-react-native", () => ({
  useStripe: () => ({
    initPaymentSheet: jest.fn().mockResolvedValue({ error: null }),
    presentPaymentSheet: jest.fn().mockResolvedValue({ error: null }),
  }),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));

jest.mock("@/stores/useRestaurantStore", () => ({
  useRestaurantStore: () => ({
    createFreeMealPaymentIntent: jest.fn().mockResolvedValue({
      success: true,
      data: {
        clientSecret: "pi_secret_test",
        paymentIntentId: "pi_12345",
        requiresStripePayment: true,
      },
    }),
    confirmFreeMealPayment: jest.fn().mockResolvedValue({
      success: true,
      data: { order: { orderId: "FREE-12345" } },
    }),
    placeFreeOrder: jest.fn().mockResolvedValue({
      success: true,
      data: { orderId: "FREE-12345" },
    }),
  }),
}));

describe("FreeMealTaxCheckoutModal Component", () => {
  const mockProps = {
    visible: true,
    onClose: jest.fn(),
    tokenId: "TKN-123",
    providerId: "PROV-456",
    foodId: "FOOD-789",
    foodTitle: "Chicken Fried Rice",
    restaurantName: "Culinary Restaurant",
    taxBreakdown: {
      mealPrice: 5.99,
      stateTax: 0.54,
      cityTax: 0.6,
      totalTax: 1.14,
      providerState: "NY",
      providerCity: "Dhaka",
    },
  };

  it("renders tax breakdown details correctly", () => {
    const { getByText } = render(<FreeMealTaxCheckoutModal {...mockProps} />);

    expect(getByText("Free Meal Checkout")).toBeTruthy();
    expect(getByText("Culinary Restaurant")).toBeTruthy();
    expect(getByText("Chicken Fried Rice")).toBeTruthy();
    expect(getByText("$1.14")).toBeTruthy();
  });
});
