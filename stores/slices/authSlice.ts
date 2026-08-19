import * as Sentry from "@sentry/react-native";
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
  isGuest: false,

  setGuestMode: (value: boolean) => {
    set({ isGuest: value });
  },

  persistAuthData: async (user: any, accessToken: any, refreshToken: any) => {
    try {
      const normalizedUser = normalizeUserPayload(user);
      const promises = [
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(normalizedUser)),
      ];

      if (normalizedUser) {
        Sentry.setUser({
          id: normalizedUser._id || normalizedUser.id,
          email: normalizedUser.email,
          username: normalizedUser.name || normalizedUser.fullName,
        });
      }

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
        throw new Error(
          result.message || result.error?.message || "Signup failed"
        );
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
      return { success: false, message: parsedMessage };
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
      Sentry.setUser(null);
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      ]);

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isGuest: false,
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
      const currentUser = (get() as any).user;
      const currentAccessToken = (get() as any).accessToken;
      const currentRefreshToken = (get() as any).refreshToken;

      const response = await fetchWithLogging(
        `${API_BASE_URL}/api/v1/auth/verify-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.email,
            otp: data.code,
          }),
        },
      );

      const result = await response.json();
      console.log("verifyOTP full result:", JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(result.message || "Verification failed");
      }

      const userData =
        result.data?.user || result.user || result.data || null;
      const accessToken =
        result.data?.session?.accessToken ||
        result.session?.accessToken ||
        result.accessToken ||
        result.data?.accessToken ||
        result.token;
      const refreshToken =
        result.data?.session?.refreshToken ||
        result.session?.refreshToken ||
        result.refreshToken ||
        result.data?.refreshToken;

      const verifiedUser =
        userData ||
        (currentUser ? { ...currentUser, isVerified: true } : null);
      const verifiedAccessToken = accessToken || currentAccessToken;
      const verifiedRefreshToken = refreshToken || currentRefreshToken;

      if (verifiedUser && verifiedAccessToken) {
        await (get() as any).persistAuthData(
          verifiedUser,
          verifiedAccessToken,
          verifiedRefreshToken,
        );

        set({
          user: normalizeUserPayload(verifiedUser),
          accessToken: verifiedAccessToken,
          refreshToken: verifiedRefreshToken || null,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }

      return result;
    } catch (error: any) {
      console.log("verifyOTP error:", error);
      const parsedMessage = translateApiMessage(error.message);
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
          body: JSON.stringify({
            email: data.email,
            otp: data.code,
          }),
        },
      );

      const result = await response.json();
      console.log("verifyForgotOTP full result:", JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(result.message || "Verification failed");
      }

      const resetToken = result.data?.accessToken || result.accessToken;
      set({ resetToken: resetToken || null, isLoading: false });

      return result;
    } catch (error: any) {
      console.log("verifyForgotOTP error:", error);
      const parsedMessage = translateApiMessage(error.message);
      set({ error: parsedMessage, isLoading: false });
      return null;
    }
  },

  resetPassword: async (data: { newPassword: string; confirmPassword: string }) => {
    set({ isLoading: true, error: null });
    try {
      const { resetToken } = get() as any;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (resetToken) {
        headers["Authorization"] = `Bearer ${resetToken}`;
      }

      const response = await fetchWithLogging(
        `${API_BASE_URL}/api/v1/auth/reset-password`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            newPassword: data.newPassword,
            confirmPassword: data.confirmPassword || data.newPassword,
          }),
        },
      );

      const result = await response.json();
      console.log("resetPassword result:", JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(result.message || "Reset password failed");
      }

      set({ isLoading: false, resetToken: null });
      return result;
    } catch (error: any) {
      console.log("resetPassword error:", error);
      const parsedMessage = translateApiMessage(error.message);
      set({ error: parsedMessage, isLoading: false });
      return null;
    }
  },

  updateProfile: async (data: Partial<any>) => {
    set({ isLoading: true, error: null });
    try {
      const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
      const headers: Record<string, string> = isFormData
        ? {}
        : { "Content-Type": "application/json" };

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/profile`,
        {
          method: "PATCH",
          headers,
          body: isFormData ? data : JSON.stringify(data),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to update profile");
      }

      const updatedUser = extractUserPayload(result) || {
        ...get().user,
        ...(isFormData ? {} : data),
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

  googleLogin: async (data: { idToken: string; requestedRole?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithLogging(
        `${API_BASE_URL}/api/auth/google`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken: data.idToken,
            requestedRole: data.requestedRole || "CUSTOMER",
          }),
        },
      );

      const result = await response.json();
      console.log("Google login result:", JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(result.message || "Google login failed");
      }

      const userData = extractUserPayload(result) || result.data?.user || result.user || result.data;
      const session = result.data?.session || result.session;
      const accessToken =
        session?.accessToken ||
        result.accessToken ||
        result.data?.accessToken;
      const refreshToken =
        session?.refreshToken ||
        result.refreshToken ||
        result.data?.refreshToken;

      if (userData && accessToken) {
        await (get() as any).persistAuthData(userData, accessToken, refreshToken);
        set({
          user: normalizeUserPayload(userData),
          accessToken,
          refreshToken: refreshToken || null,
          isLoading: false,
        });
        return result;
      } else {
        throw new Error("Invalid response format: User or token is missing");
      }
    } catch (error: any) {
      console.log("googleLogin error:", error);
      const parsedMessage = translateApiMessage(error.message);
      set({ error: parsedMessage, isLoading: false });
      return null;
    }
  },

  appleLogin: async (data: { idToken: string; fullName: string; requestedRole?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithLogging(
        `${API_BASE_URL}/api/auth/apple`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken: data.idToken,
            fullName: data.fullName,
            requestedRole: data.requestedRole || "CUSTOMER",
          }),
        },
      );

      const result = await response.json();
      console.log("Apple login result:", JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(result.message || "Apple login failed");
      }

      const userData = extractUserPayload(result) || result.data?.user || result.user || result.data;
      const session = result.data?.session || result.session;
      const accessToken =
        session?.accessToken ||
        result.accessToken ||
        result.data?.accessToken;
      const refreshToken =
        session?.refreshToken ||
        result.refreshToken ||
        result.data?.refreshToken;

      if (userData && accessToken) {
        await (get() as any).persistAuthData(userData, accessToken, refreshToken);
        set({
          user: normalizeUserPayload(userData),
          accessToken,
          refreshToken: refreshToken || null,
          isLoading: false,
        });
        return result;
      } else {
        throw new Error("Invalid response format: User or token is missing");
      }
    } catch (error: any) {
      console.log("appleLogin error:", error);
      const parsedMessage = translateApiMessage(error.message);
      set({ error: parsedMessage, isLoading: false });
      return null;
    }
  },

  socialAuth: async (data: any) => {
    return (get() as any).googleLogin(data);
  },

  deleteAccount: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/auth/account`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to delete account");
      }

      await (get() as any).logout();
      set({ isLoading: false });
      return { success: true, message: result.message };
    } catch (error: any) {
      console.log("deleteAccount error:", error);
      set({ error: error.message, isLoading: false });
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

            const newAccess =
              data.accessToken ||
              data.data?.accessToken ||
              data.data?.session?.accessToken ||
              data.session?.accessToken;
            const newRefresh =
              data.refreshToken ||
              data.data?.refreshToken ||
              data.data?.session?.refreshToken ||
              data.session?.refreshToken;

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

    let response = await fetchWithLogging(url, { ...options, headers });

    if (response.status === 401 && (get() as any).refreshToken) {
      const currentState = get() as any;
      if (!refreshSessionPromise) {
        refreshSessionPromise = (async () => {
          try {
            const res = await fetchWithLogging(
              `${API_BASE_URL}/api/v1/auth/refresh`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: currentState.refreshToken }),
              },
            );
            const data = await res.json();
            if (!res.ok) throw new Error("Session expired");

            const newAccess =
              data.accessToken ||
              data.data?.accessToken ||
              data.data?.session?.accessToken ||
              data.session?.accessToken;
            const newRefresh =
              data.refreshToken ||
              data.data?.refreshToken ||
              data.data?.session?.refreshToken ||
              data.session?.refreshToken;

            set({ accessToken: newAccess });
            if (newRefresh) set({ refreshToken: newRefresh });

            await (get() as any).persistAuthData(currentState.user, newAccess, newRefresh || currentState.refreshToken);
            return newAccess;
          } catch (err) {
            await (get() as any).logout();
            throw err;
          } finally {
            refreshSessionPromise = null;
          }
        })();
      }

      try {
        const newAccess = await refreshSessionPromise;
        if (newAccess) {
          const retryHeaders = {
            ...headersToRecord(options.headers),
            Authorization: `Bearer ${newAccess}`,
          };
          response = await fetchWithLogging(url, { ...options, headers: retryHeaders });
        }
      } catch (err) {
        console.log("Token refresh failed on 401 retry:", err);
      }
    }

    return response;
  },
});
