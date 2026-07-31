import { API_BASE_URL, fetchWithLogging } from "@/utils/api";
import type { RootStore } from "../types";
import { extractUserPayload, normalizeUserPayload } from "../utils/storeHelpers";

export interface FeedState {
  banners: any[];
  categories: any[];
  homeFeed: any | null;
  notifications: any[];
}

export interface FeedActions {
  fetchProfile: () => Promise<any>;
  fetchHomeFeed: (params?: {
    page?: number;
    limit?: number;
    categoryName?: string;
    providerId?: string;
  }) => Promise<any>;
  fetchCategories: () => Promise<any[]>;
  fetchBanners: () => Promise<any[]>;
  fetchNotifications: () => Promise<any[]>;
}

export type FeedSlice = FeedState & FeedActions;

export const createFeedSlice = (set: any, get: () => RootStore): FeedSlice => ({
  banners: [],
  categories: [],
  homeFeed: null,
  notifications: [],

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/profile/me`,
        {
          method: "GET",
          headers: {},
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch profile");
      }

      const latestUser = extractUserPayload(result);
      if (latestUser) {
        const currentUser = (get() as any).user;
        const mergedUser = { ...currentUser, ...latestUser };
        set((state: any) => ({
          user: normalizeUserPayload(mergedUser),
          isLoading: false,
        }));
      } else {
        set({ isLoading: false });
      }

      return result;
    } catch (error: any) {
      console.log("fetchProfile error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  fetchHomeFeed: async (
    params: {
      page?: number;
      limit?: number;
      categoryName?: string;
      providerId?: string;
    } = {},
  ) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      const query = new URLSearchParams();

      if (params.page) query.append("page", String(params.page));
      if (params.limit) query.append("limit", String(params.limit));
      if (params.categoryName) {
        query.append("categoryName", params.categoryName);
        query.append("category", params.categoryName);
      }
      if (params.providerId) {
        query.append("providerId", params.providerId);
        query.append("restaurantId", params.providerId);
      }

      const queryString = query.toString() ? `?${query.toString()}` : "";
      const headers = {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      };

      const endpoints = [
        `${API_BASE_URL}/api/v1/feed/home${queryString}`,
        `${API_BASE_URL}/api/v1/feed${queryString}`,
      ];

      let lastError: Error | null = null;

      for (const endpoint of endpoints) {
        try {
          const response = await (get() as any).requestWithAuth(endpoint, {
            method: "GET",
            headers,
          });

          const result = await response.json();
          if (response.ok && result) {
            set({ homeFeed: result, isLoading: false });
            return result;
          }
        } catch (err: any) {
          lastError = err;
        }
      }

      throw lastError || new Error("Failed to fetch home feed");
    } catch (error: any) {
      console.log("fetchHomeFeed error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = get() as any;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetchWithLogging(
        `${API_BASE_URL}/api/v1/categories`,
        {
          method: "GET",
          headers,
        },
      );

      const result = await response.json();
      set({ isLoading: false });

      const categoryList =
        result.success && Array.isArray(result.data)
          ? result.data
          : Array.isArray(result)
            ? result
            : [];

      set({ categories: categoryList });
      return categoryList;
    } catch (error: any) {
      console.log("fetchCategories error:", error);
      set({ error: error.message, isLoading: false });
      return [];
    }
  },

  fetchBanners: async () => {
    try {
      const { accessToken } = get() as any;

      const headers = {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      };

      const endpoints = [
        `${API_BASE_URL}/api/v1/banners/active`,
        `${API_BASE_URL}/api/v1/banners`,
        `${API_BASE_URL}/api/v1/feed/banners`,
      ];

      let allBanners: any[] = [];
      const seenIds = new Set();

      for (const endpoint of endpoints) {
        try {
          const response = await fetchWithLogging(endpoint, {
            method: "GET",
            headers,
          });

          const result = await response.json();
          if (!response.ok) continue;

          let banners: any[] = [];
          if (Array.isArray(result?.data)) {
            banners = result.data;
          } else if (Array.isArray(result?.banners)) {
            banners = result.banners;
          } else if (Array.isArray(result)) {
            banners = result;
          } else if (result?.data) {
            banners = [result.data];
          } else if (result?.banner) {
            banners = [result.banner];
          }

          banners.forEach((banner) => {
            const id = banner?._id || banner?.id || JSON.stringify(banner);
            if (!seenIds.has(id)) {
              seenIds.add(id);
              allBanners.push(banner);
            }
          });
        } catch {
          // ignore single endpoint failures
        }
      }

      set({ banners: allBanners });
      return allBanners;
    } catch (error: any) {
      console.log("fetchBanners error:", error);
      return [];
    }
  },

  fetchNotifications: async () => {
    try {
      const { accessToken } = get() as any;
      if (!accessToken && !(get() as any).refreshToken)
        throw new Error("No access token found");

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/notifications`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch notifications");
      }

      const notifs = result.data || result.notifications || [];
      set({ notifications: notifs });
      return notifs;
    } catch (error: any) {
      console.log("fetchNotifications error:", error);
      return [];
    }
  },
});
