import { create } from "zustand";
import { createAuthSlice } from "./slices/authSlice";
import { createCartSlice } from "./slices/cartSlice";
import { createOrderSlice } from "./slices/orderSlice";
import { createReviewSlice } from "./slices/reviewSlice";
import type { RootStore } from "./types";

export type {
  RootStore,
  AuthState,
  AuthActions,
  CartState,
  CartActions,
  OrderState,
  OrderActions,
  ReviewState,
  ReviewActions,
  UserProfile,
  CartItem,
  Order,
} from "./types";

export const useStore = create<RootStore>((set, get) => ({
  ...createAuthSlice(set, get),
  ...createCartSlice(set, get),
  ...createOrderSlice(set, get),
  ...createReviewSlice(set, get),
}));
