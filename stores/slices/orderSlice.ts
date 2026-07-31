import { API_BASE_URL } from "@/utils/api";
import type { OrderState, OrderActions, RootStore } from "../types";

export type OrderSlice = OrderState & OrderActions;

export const createOrderSlice = (set: any, get: () => RootStore): OrderSlice => ({
  currentOrders: [],
  previousOrders: [],
  ordersLoading: false,

  fetchCurrentOrders: async () => {
    set({ ordersLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/orders/current`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch current orders");
      }

      set({ currentOrders: result.data || [], ordersLoading: false });
      return result;
    } catch (error: any) {
      console.log("fetchCurrentOrders error:", error);
      set({ error: error.message, ordersLoading: false });
      return null;
    }
  },

  fetchPreviousOrders: async () => {
    set({ ordersLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/orders/previous`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch previous orders");
      }

      set({ previousOrders: result.data || [], ordersLoading: false });
      return result;
    } catch (error: any) {
      console.log("fetchPreviousOrders error:", error);
      set({ error: error.message, ordersLoading: false });
      return null;
    }
  },

  fetchOrderById: async (orderId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/orders/${orderId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch order details");
      }

      set({ isLoading: false });
      return result.data || result;
    } catch (error: any) {
      console.log("fetchOrderById error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  createOrder: async (orderData: any) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData),
        },
      );

      const result = await response.json();
      console.log("createOrder result:", JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(result.message || "Failed to place order");
      }

      set({ isLoading: false });
      return result;
    } catch (error: any) {
      console.log("createOrder error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  cancelOrder: async (orderId: string, reason?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/orders/${orderId}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to cancel order");
      }

      set({ isLoading: false });
      return result;
    } catch (error: any) {
      console.log("cancelOrder error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  createPaymentIntent: async (payload: {
    providerId: string;
    items: { foodId: string; quantity: number }[];
  }) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/stripe/create-payment-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to create payment intent");
      }

      set({ isLoading: false });
      return result;
    } catch (error: any) {
      console.log("createPaymentIntent error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  createDonationPaymentIntent: async (mealCount: number) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/donation/create-payment-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mealCount }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result?.message || "Failed to create donation payment intent",
        );
      }

      set({ isLoading: false });
      return result;
    } catch (error: any) {
      console.log("createDonationPaymentIntent error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  confirmDonationPayment: async (paymentIntentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/donation/confirm-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paymentIntentId }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result?.message || "Failed to confirm donation payment",
        );
      }

      set({ isLoading: false });
      return result;
    } catch (error: any) {
      console.log("confirmDonationPayment error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  fetchDonationTokens: async () => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/donation/my-tokens`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Failed to fetch donation tokens");
      }

      set({ isLoading: false });
      return result;
    } catch (error: any) {
      console.log("fetchDonationTokens error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  fetchStripeConfig: async () => {
    try {
      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/stripe/config`,
        {
          method: "GET",
          headers: {},
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch Stripe config");
      }

      return result;
    } catch (error: any) {
      console.log("fetchStripeConfig error:", error);
      return null;
    }
  },
});
