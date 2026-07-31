import { API_BASE_URL, fetchWithLogging } from "@/utils/api";
import type { RootStore } from "../types";
import { uriToBlob } from "../utils/storeHelpers";

export interface ChatState {
  conversations: any[];
  messages: any[];
}

export interface ChatActions {
  fetchConversations: (limit?: number) => Promise<any>;
  createConversation: (providerId: string) => Promise<any>;
  fetchMessages: (conversationId: string, page?: number, limit?: number) => Promise<any>;
  sendMessage: (conversationId: string, message: string, attachments?: any[]) => Promise<any>;
  sendMessageToProvider: (providerId: string | undefined, message: string, attachments?: any[]) => Promise<any>;
}

export type ChatSlice = ChatState & ChatActions;

export const createChatSlice = (set: any, get: () => RootStore): ChatSlice => ({
  conversations: [],
  messages: [],

  fetchConversations: async (limit = 20) => {
    set({ isLoading: true, error: null });
    try {
      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/chat/conversations?limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch conversations");
      }

      set({ conversations: result.data || [], isLoading: false });
      return result.data;
    } catch (error: any) {
      console.log("fetchConversations error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  createConversation: async (providerId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/chat/conversations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ providerId }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to create conversation");
      }

      set({ isLoading: false });
      return result.data;
    } catch (error: any) {
      console.log("createConversation error:", error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  fetchMessages: async (conversationId: string, page = 1, limit = 20) => {
    set({ isLoading: true, error: null });
    try {
      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch messages");
      }

      set({ messages: result.data || [], isLoading: false });
      return result.data;
    } catch (error: any) {
      console.log("fetchMessages error:", error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  sendMessage: async (
    conversationId: string,
    message: string,
    attachments: any[] = [],
  ) => {
    set({ isLoading: true, error: null });
    try {
      const isFormData = attachments.length > 0;
      let body: any;

      if (isFormData) {
        body = new FormData();
        body.append("message", message);
        for (let index = 0; index < attachments.length; index++) {
          const file = attachments[index];
          const fileName = file.uri.split("/").pop() || `attachment_${index}.jpg`;
          const blob = await uriToBlob(file.uri);
          body.append("attachments", blob, fileName);
        }
      } else {
        body = JSON.stringify({ message });
      }

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/chat/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
          },
          body: body,
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to send message");
      }

      set({ isLoading: false });
      return result;
    } catch (error: any) {
      console.log("sendMessage error details:", error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  sendMessageToProvider: async (
    providerId: string | undefined,
    message: string,
    attachments: any[] = [],
  ) => {
    set({ isLoading: true, error: null });
    try {
      const isFormData = attachments.length > 0;
      let body: any;

      if (isFormData) {
        body = new FormData();
        body.append("text", message);

        for (let index = 0; index < attachments.length; index++) {
          const file = attachments[index];
          const fileName = file.uri.split("/").pop() || `image_${index}.jpg`;
          const blob = await uriToBlob(file.uri);
          body.append("image", blob, fileName);
        }
      } else {
        body = JSON.stringify({ text: message });
      }

      const response = await (get() as any).requestWithAuth(
        `${API_BASE_URL}/api/v1/chat/message/customer-to-admin`,
        {
          method: "POST",
          headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
          },
          body: body,
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to send message");
      }

      set({ isLoading: false });
      return result;
    } catch (error: any) {
      console.log("sendMessageToProvider error details:", error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
});
