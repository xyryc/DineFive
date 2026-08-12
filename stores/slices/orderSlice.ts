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
        `${API_BASE_URL}/api/v1/customer/orders/current`,
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

      const orders = result.data || (Array.isArray(result) ? result : []);
      set({ currentOrders: orders, ordersLoading: false });
      return result;
    } catch (error: any) {
      console.log("fetchCurrentOrders error:", error);
      set({ error: error.message, ordersLoading: false });
      return null;
    }
  },

  fetchPreviousOrders: async (page = 1, limit = 10) => {
    set({ ordersLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/customer/orders/previous?page=${page}&limit=${limit}`,
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

      const prevOrders = result.data || result.orders || (Array.isArray(result) ? result : []);
      set({ previousOrders: prevOrders, ordersLoading: false });
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
      console.log(
        `📥 [GET /api/v1/orders/${orderId}] Raw API Response:`,
        JSON.stringify(result, null, 2),
      );

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

      console.log("📤 [POST /api/v1/orders] Request Body:", JSON.stringify(orderData, null, 2));

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
      console.log("📥 [POST /api/v1/orders] API Response:", JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(result.message || "Failed to place order");
      }

      set({ isLoading: false });
      return result;
    } catch (error: any) {
      console.log("❌ [POST /api/v1/orders] Error:", error);
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
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason, status: "cancelled" }),
        },
      );

      const result = await response.json();
      console.log("Cancel Order Response:", JSON.stringify(result, null, 2));

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

  createDonationPaymentIntent: async (payload: any) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const bodyData =
        typeof payload === "object" && payload !== null
          ? payload
          : { mealCount: payload };

      console.log(
        "📤 [POST /api/v1/donation/create-payment-intent] Request Body:",
        JSON.stringify(bodyData, null, 2),
      );

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/donation/create-payment-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bodyData),
        },
      );

      const result = await response.json();
      console.log(
        "📥 [POST /api/v1/donation/create-payment-intent] Response Body:",
        JSON.stringify(result, null, 2),
      );

      if (!response.ok) {
        throw new Error(
          result?.message || "Failed to create donation payment intent",
        );
      }

      set({ isLoading: false });
      return result;
    } catch (error: any) {
      console.log("❌ [POST /api/v1/donation/create-payment-intent] Error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  fetchDonationBreakdown: async (mealCount: number) => {
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const bodyData = { mealCount };
      console.log(
        "📤 [POST /api/v1/donation/checkout-breakdown] Request Body:",
        JSON.stringify(bodyData, null, 2),
      );

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/donation/checkout-breakdown`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bodyData),
        },
      );

      const result = await response.json();
      console.log(
        "📥 [POST /api/v1/donation/checkout-breakdown] Response Body:",
        JSON.stringify(result, null, 2),
      );

      if (!response.ok) {
        throw new Error(
          result?.message || "Failed to fetch donation checkout breakdown",
        );
      }

      return result;
    } catch (error: any) {
      console.log("❌ [POST /api/v1/donation/checkout-breakdown] Error:", error);
      return null;
    }
  },

  confirmDonationPayment: async (paymentIntentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      console.log("📤 [POST /api/v1/donation/confirm-payment] Request Payload:", JSON.stringify({ paymentIntentId }, null, 2));

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
      console.log("📥 [POST /api/v1/donation/confirm-payment] API Response:", JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(
          result?.message || "Failed to confirm donation payment",
        );
      }

      set({ isLoading: false });
      return result;
    } catch (error: any) {
      console.log("❌ [POST /api/v1/donation/confirm-payment] Error:", error);
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
      console.log("📥 [GET /api/v1/donation/my-tokens] API Response:", JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(result?.message || "Failed to fetch donation tokens");
      }

      set({ isLoading: false });
      return result;
    } catch (error: any) {
      console.log("❌ [GET /api/v1/donation/my-tokens] Error:", error);
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
      console.log("📥 [GET /api/v1/stripe/config] API Response:", JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch Stripe config");
      }

      return result;
    } catch (error: any) {
      console.log("❌ [GET /api/v1/stripe/config] Error:", error);
      return null;
    }
  },
});
