import { API_BASE_URL, fetchWithLogging } from "@/utils/api";
import type { ReviewState, ReviewActions, RootStore } from "../types";

export type ReviewSlice = ReviewState & ReviewActions;

export const createReviewSlice = (set: any, get: () => RootStore): ReviewSlice => ({
  favorites: [],

  fetchReviewsByFoodId: async (foodId: string) => {
    try {
      const response = await fetchWithLogging(
        `${API_BASE_URL}/api/v1/reviews/food/${foodId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch reviews");
      }

      return result;
    } catch (error: any) {
      console.log("fetchReviewsByFoodId error:", error);
      return { data: [], meta: { total: 0 } };
    }
  },

  fetchReviewByOrderId: async (identifier: string) => {
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/reviews/order/${identifier}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch review");
      }

      return result;
    } catch (error: any) {
      console.log("fetchReviewByOrderId error:", error);
      return null;
    }
  },

  createReview: async (reviewData: any) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reviewData),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || result.error?.message || "Failed to submit review");
      }

      set({ isLoading: false });
      return { success: true, ...result };
    } catch (error: any) {
      console.log("createReview error:", error);
      set({ error: error.message, isLoading: false });
      return { success: false, message: error.message };
    }
  },

  submitReview: async (
    orderId: string,
    foodId: string,
    rating: number,
    comment: string
  ) => {
    const payload: any = { rating, comment };

    if (orderId) {
      if (typeof orderId === "string") {
        payload.orderId = orderId;
      } else if (typeof orderId === "object") {
        payload.orderId = (orderId as any)._id || (orderId as any).id;
      }
    }

    if (foodId) {
      if (typeof foodId === "string" && foodId !== "[object Object]") {
        payload.foodId = foodId;
      } else if (typeof foodId === "object") {
        const id = (foodId as any)._id || (foodId as any).id;
        if (id) payload.foodId = id;
      }
    }

    console.log("📤 Submitting review payload:", JSON.stringify(payload, null, 2));

    const res = await (get() as any).createReview(payload);
    if (res && res.success) {
      return { success: true, data: res.data?.reviews?.[0] || res.data || res };
    }
    return {
      success: false,
      message: res?.message || "Failed to submit review",
    };
  },

  updateReview: async (reviewId: string, rating: number, comment?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/reviews/${reviewId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rating, comment }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to update review");
      }

      set({ isLoading: false });
      return { success: true, data: result.data || result };
    } catch (error: any) {
      console.log("updateReview error:", error);
      set({ error: error.message, isLoading: false });
      return { success: false, message: error.message };
    }
  },

  fetchFavorites: async (page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/favorites/feed?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();
      console.log("fetchFavorites result:", JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch favorites");
      }

      const favItems = result.data?.favorites || result.favorites || result.data || (Array.isArray(result) ? result : []);
      const favIds = Array.isArray(favItems)
        ? favItems.map((item: any) => item.foodId?._id || item.foodId || item._id)
        : [];
      set({ favorites: favIds, isLoading: false });

      return result;
    } catch (error: any) {
      console.log("fetchFavorites error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  addFavorite: async (foodId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/favorites`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ foodId }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to add favorite");
      }

      set((state: any) => ({
        favorites: Array.from(new Set([...state.favorites, foodId])),
        isLoading: false,
      }));
      return result;
    } catch (error: any) {
      console.log("addFavorite error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  removeFavorite: async (foodId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/favorites/${foodId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to remove favorite");
      }

      set((state: any) => ({
        favorites: state.favorites.filter((id: string) => id !== foodId),
        isLoading: false,
      }));
      return result;
    } catch (error: any) {
      console.log("removeFavorite error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  fetchStateTax: async (stateName: string) => {
    if (!stateName) return null;
    try {
      const response = await fetchWithLogging(
        `${API_BASE_URL}/api/v1/states/tax?state=${encodeURIComponent(stateName)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch state tax");
      }

      return result;
    } catch (error: any) {
      console.log("fetchStateTax error:", error);
      return null;
    }
  },
});
