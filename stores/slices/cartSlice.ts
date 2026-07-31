import { API_BASE_URL } from "@/utils/api";
import type { CartState, CartActions, RootStore } from "../types";

export type CartSlice = CartState & CartActions;

export const createCartSlice = (set: any, get: () => RootStore): CartSlice => ({
  cartItems: [],
  cartCount: 0,
  isCartSyncing: false,

  addToCart: async (item: any, quantity: number = 1) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const resolvedFoodId = [
        item?.foodId,
        item?._id,
        item?.id,
        item?.food?.foodId,
        item?.food?._id,
        item?.food?.id,
        item?.menuItemId,
        item?.itemId,
      ]
        .map((value) =>
          typeof value === "string"
            ? value.trim()
            : String(value || "").trim(),
        )
        .find((value) => !!value);

      if (!resolvedFoodId) {
        throw new Error("Food ID is missing for cart item");
      }

      const safeQuantity = Math.max(1, Math.floor(Number(quantity) || 1));

      const payload = {
        foodId: resolvedFoodId,
        quantity: safeQuantity,
      };

      console.log("Adding to cart:", payload);

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/cart/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();
      console.log("addToCart result:", JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error?.message ||
            result?.error ||
            "Failed to add item to cart",
        );
      }

      (get() as any).fetchCartCount?.().catch(() => {});
      set({ isLoading: false });
      return result;
    } catch (error: any) {
      console.log("addToCart error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/cart`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();
      console.log("📥 [GET /api/v1/cart] API Response:", JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error?.message ||
            result?.error ||
            "Failed to fetch cart",
        );
      }

      const payload =
        result?.data?.cart ?? result?.data ?? result?.cart ?? result;
      set({ isLoading: false });
      return payload;
    } catch (error: any) {
      console.log("fetchCart error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  fetchCartCount: async () => {
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken) return 0;

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/cart/count`,
        {
          method: "GET",
          headers: {},
        },
      );

      const result = await response.json();
      if (response.ok) {
        return result.data?.count || result.count || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  },

  updateCartQuantity: async (foodId: string, quantity: number) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/cart/update`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ foodId, quantity }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error?.message ||
            result?.error ||
            "Failed to update cart",
        );
      }

      set({ isLoading: false });
      return result;
    } catch (error: any) {
      console.log("updateCartQuantity error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  removeCartItem: async (foodId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/cart/remove`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ foodId }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error?.message ||
            result?.error ||
            "Failed to remove item",
        );
      }

      set({ isLoading: false });
      return result;
    } catch (error: any) {
      console.log("removeCartItem error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  clearCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/cart/clear`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to clear cart");
      }

      set({ isLoading: false });
      return result;
    } catch (error: any) {
      console.log("clearCart error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },
});
