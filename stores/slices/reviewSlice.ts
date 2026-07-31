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
        throw new Error(result.message || "Failed to submit review");
      }

      set({ isLoading: false });
      return result;
    } catch (error: any) {
      console.log("createReview error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  fetchFavorites: async (page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/favorites?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch favorites");
      }

      const favItems = result.data || [];
      const favIds = favItems.map((item: any) => item.foodId?._id || item.foodId || item._id);
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
