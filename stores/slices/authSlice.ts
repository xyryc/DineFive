import { API_BASE_URL, fetchWithLogging } from "@/utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthState, AuthActions, RootStore } from "../types";
import {
  STORAGE_KEYS,
  extractUserPayload,
  normalizeUserPayload,
  translateApiMessage,
  uriToBlob,
  headersToRecord,
} from "../utils/storeHelpers";

export type AuthSlice = AuthState & AuthActions;

let refreshSessionPromise: Promise<any> | null = null;

export const createAuthSlice = (set: any, get: () => RootStore): AuthSlice => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  isInitialized: false,
  resetToken: null,

  persistAuthData: async (user: any, accessToken: any, refreshToken: any) => {
    try {
      const promises = [
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
      ];

      if (accessToken) {
        promises.push(
          AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        );
      }

      if (refreshToken) {
        promises.push(
          AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
        );
      }

      await Promise.all(promises);
    } catch (error) {
      console.log("Failed to persist auth data:", error);
      throw error;
    }
  },

  initializeAuth: async () => {
    try {
      const [user, accessToken, refreshToken] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
      ]);

      if (user) {
        const parsedUser = JSON.parse(user);
        set({
          user: parsedUser,
          accessToken: accessToken || null,
          refreshToken: refreshToken || null,
          isInitialized: true,
        });
        return { user: parsedUser, accessToken };
      } else {
        set({ isInitialized: true });
        return { user: null, accessToken: null };
      }
    } catch (error) {
      console.log("Failed to initialize auth:", error);
      set({ isInitialized: true });
      return { user: null, accessToken: null };
    }
  },

  signup: async (data: any) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetchWithLogging(
        `${API_BASE_URL}/api/v1/auth/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      const result = await response.json();
      console.log("Signup result:", JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(result.message || "Signup failed");
      }

      const userData = result.data?.user || result.user;
      const sessionData = result.data?.session || result.session;

      if (userData) {
        await (get() as any).persistAuthData(
          userData,
          sessionData?.accessToken,
          sessionData?.refreshToken,
        );

        set({
          user: userData,
          accessToken: sessionData?.accessToken || null,
          refreshToken: sessionData?.refreshToken || null,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }

      return result;
    } catch (error: any) {
      const parsedMessage = translateApiMessage(error.message);
      console.log("Signup error:", parsedMessage);
      set({ error: parsedMessage, isLoading: false });
      return null;
    }
  },

  login: async (data: any) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetchWithLogging(
        `${API_BASE_URL}/api/v1/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      const result = await response.json();
      console.log("Login result:", JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(result.message || "Login failed");
      }

      const userData = extractUserPayload(result);
      const sessionData =
        result.data?.session ||
        result.session ||
        result.data?.tokens ||
        result.tokens;

      const accessToken =
        sessionData?.accessToken || result.accessToken || result.data?.accessToken;
      const refreshToken =
        sessionData?.refreshToken || result.refreshToken || result.data?.refreshToken;

      if (userData) {
        await (get() as any).persistAuthData(userData, accessToken, refreshToken);
        set({
          user: userData,
          accessToken: accessToken || null,
          refreshToken: refreshToken || null,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }

      return result;
    } catch (error: any) {
      const parsedMessage = translateApiMessage(error.message);
      console.log("Login error:", parsedMessage);
      set({ error: parsedMessage, isLoading: false });
      return null;
    }
  },

  logout: async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      ]);

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
      });

      return true as any;
    } catch (error) {
      console.log("Failed to logout:", error);
      return false as any;
    }
  },

  verifyOTP: async (data: { email: string; code: string }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithLogging(
        `${API_BASE_URL}/api/v1/auth/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      const result = await response.json();
      console.log("verifyOTP result:", JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(result.message || "Verification failed");
      }

      const userData = extractUserPayload(result);
      const sessionData = result.data?.session || result.session;

      if (userData) {
        await (get() as any).persistAuthData(
          userData,
          sessionData?.accessToken,
          sessionData?.refreshToken,
        );

        set({
          user: userData,
          accessToken: sessionData?.accessToken || null,
          refreshToken: sessionData?.refreshToken || null,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }

      return result;
    } catch (error: any) {
      const parsedMessage = translateApiMessage(error.message);
      console.log("verifyOTP error:", parsedMessage);
      set({ error: parsedMessage, isLoading: false });
      return null;
    }
  },

  sendOTP: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithLogging(
        `${API_BASE_URL}/api/v1/auth/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to send OTP");
      }

      set({ isLoading: false });
      return result;
    } catch (error: any) {
      const parsedMessage = translateApiMessage(error.message);
      set({ error: parsedMessage, isLoading: false });
      return null;
    }
  },

  forgotPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithLogging(
        `${API_BASE_URL}/api/v1/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to send reset code");
      }

      set({ isLoading: false });
      return result;
    } catch (error: any) {
      const parsedMessage = translateApiMessage(error.message);
      set({ error: parsedMessage, isLoading: false });
      return null;
    }
  },

  verifyForgotOTP: async (data: { email: string; code: string }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithLogging(
        `${API_BASE_URL}/api/v1/auth/verify-forgot-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Verification failed");
      }

      set({ isLoading: false });
      return result;
    } catch (error: any) {
      const parsedMessage = translateApiMessage(error.message);
      set({ error: parsedMessage, isLoading: false });
      return null;
    }
  },

  resetPassword: async (data: { email: string; code: string; newPassword: string }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithLogging(
        `${API_BASE_URL}/api/v1/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Reset password failed");
      }

      set({ isLoading: false });
      return result;
    } catch (error: any) {
      const parsedMessage = translateApiMessage(error.message);
      set({ error: parsedMessage, isLoading: false });
      return null;
    }
  },

  updateProfile: async (data: Partial<any>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/users/profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to update profile");
      }

      const updatedUser = extractUserPayload(result) || {
        ...get().user,
        ...data,
      };

      set((state: any) => ({
        user: normalizeUserPayload(updatedUser),
        isLoading: false,
      }));

      await AsyncStorage.setItem(
        STORAGE_KEYS.USER,
        JSON.stringify(updatedUser),
      );

      return result;
    } catch (error: any) {
      console.log("updateProfile error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  updateAvatar: async (imageUri: string) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      const filename = imageUri.split("/").pop() || "avatar.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("avatar", {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/users/avatar`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to upload avatar");
      }

      const updatedUser = extractUserPayload(result) || {
        ...get().user,
        avatar: result.data?.avatar || result.avatar,
      };

      set((state: any) => ({
        user: normalizeUserPayload(updatedUser),
        isLoading: false,
      }));

      await AsyncStorage.setItem(
        STORAGE_KEYS.USER,
        JSON.stringify(updatedUser),
      );

      return result;
    } catch (error: any) {
      console.log("updateAvatar error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  socialAuth: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithLogging(
        `${API_BASE_URL}/api/v1/auth/social-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Social login failed");
      }

      const userData = extractUserPayload(result);
      const sessionData = result.data?.session || result.session;

      if (userData) {
        await (get() as any).persistAuthData(
          userData,
          sessionData?.accessToken,
          sessionData?.refreshToken,
        );

        set({
          user: userData,
          accessToken: sessionData?.accessToken || null,
          refreshToken: sessionData?.refreshToken || null,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }

      return result;
    } catch (error: any) {
      const parsedMessage = translateApiMessage(error.message);
      set({ error: parsedMessage, isLoading: false });
      return null;
    }
  },

  requestWithAuth: async (url: string, options: RequestInit = {}) => {
    const state = get() as any;
    let token = state.accessToken;

    if (!token && state.refreshToken) {
      if (!refreshSessionPromise) {
        refreshSessionPromise = (async () => {
          try {
            const res = await fetchWithLogging(
              `${API_BASE_URL}/api/v1/auth/refresh`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: state.refreshToken }),
              },
            );
            const data = await res.json();
            if (!res.ok) throw new Error("Session expired");

            const newAccess = data.accessToken || data.data?.accessToken;
            const newRefresh = data.refreshToken || data.data?.refreshToken;

            set({ accessToken: newAccess });
            if (newRefresh) set({ refreshToken: newRefresh });

            await (get() as any).persistAuthData(state.user, newAccess, newRefresh || state.refreshToken);
            return newAccess;
          } catch (err) {
            await (get() as any).logout();
            throw err;
          } finally {
            refreshSessionPromise = null;
          }
        })();
      }
      token = await refreshSessionPromise;
    }

    const headers = {
      ...headersToRecord(options.headers),
      Authorization: `Bearer ${token}`,
    };

    return fetchWithLogging(url, { ...options, headers });
  },
});
