export interface UserProfile {
  _id?: string;
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  Email?: string;
  phone?: string;
  phoneNumber?: string;
  PhoneNumber?: string;
  bio?: string;
  Boi?: string;
  photo?: string;
  avatar?: string;
  profilePic?: string;
  image?: string;
  lat?: number;
  lng?: number;
  [key: string]: any;
}

export interface CartItem {
  id: string;
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  restaurantName?: string;
  restaurantAddress?: string;
  [key: string]: any;
}

export interface CartMeta {
  platformFee?: number;
  cityTax?: number;
  stateTax?: number;
  stateTaxAmount?: number;
  countyTaxAmount?: number;
  total?: number;
  subtotal?: number;
  [key: string]: any;
}

export interface OrderItem {
  _id?: string;
  id?: string;
  name?: string;
  price?: number;
  quantity?: number;
  image?: string;
  [key: string]: any;
}

export interface Order {
  _id: string;
  id?: string;
  status: string;
  total: number;
  subtotal?: number;
  items: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  resetToken: string | null;
}

export interface AuthActions {
  initializeAuth: () => Promise<{ user: UserProfile | null; accessToken: string | null }>;
  persistAuthData: (user: any, accessToken: any, refreshToken: any) => Promise<void>;
  signup: (data: any) => Promise<any>;
  login: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  verifyOTP: (data: { email: string; code: string }) => Promise<any>;
  sendOTP: (email: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  verifyForgotOTP: (data: { email: string; code: string }) => Promise<any>;
  resetPassword: (data: { newPassword: string; confirmPassword?: string }) => Promise<any>;
  updateProfile: (data: Partial<UserProfile>) => Promise<any>;
  updateAvatar: (imageUri: string) => Promise<any>;
  socialAuth: (data: any) => Promise<any>;
  googleLogin: (data: { idToken: string; requestedRole?: string }) => Promise<any>;
  deleteAccount: () => Promise<any>;
  requestWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

export interface CartState {
  cartItems: CartItem[];
  cartCount: number;
  isCartSyncing: boolean;
}

export interface CartActions {
  fetchCart: () => Promise<any>;
  fetchCartCount: () => Promise<number>;
  addToCart: (item: any, quantity?: number) => Promise<any>;
  updateCartQuantity: (itemId: string, quantity: number) => Promise<any>;
  removeCartItem: (itemId: string) => Promise<any>;
  clearCart: () => Promise<any>;
}

export interface OrderState {
  currentOrders: Order[];
  previousOrders: Order[];
  ordersLoading: boolean;
}

export interface OrderActions {
  fetchCurrentOrders: () => Promise<any>;
  fetchPreviousOrders: () => Promise<any>;
  fetchOrderById: (orderId: string) => Promise<any>;
  createOrder: (orderData: any) => Promise<any>;
  cancelOrder: (orderId: string, reason?: string) => Promise<any>;
  createPaymentIntent: (data: any) => Promise<any>;
  createDonationPaymentIntent: (data: any) => Promise<any>;
  fetchDonationBreakdown: (mealCount: number) => Promise<any>;
  confirmDonationPayment: (data: any) => Promise<any>;
  fetchDonationTokens: () => Promise<any>;
  fetchStripeConfig: () => Promise<any>;
}

export interface ReviewState {
  favorites: string[];
}

export interface ReviewActions {
  fetchReviewsByFoodId: (foodId: string) => Promise<any>;
  fetchReviewByOrderId: (orderId: string) => Promise<any>;
  createReview: (reviewData: any) => Promise<any>;
  fetchFavorites: () => Promise<any>;
  addFavorite: (foodId: string) => Promise<any>;
  removeFavorite: (foodId: string) => Promise<any>;
  fetchStateTax: (candidates?: any) => Promise<any>;
}

export interface FeedState {
  banners: any[];
  categories: any[];
  homeFeed: any | null;
  notifications: any[];
}

export interface FeedActions {
  fetchProfile: () => Promise<any>;
  fetchHomeFeed: (params?: any) => Promise<any>;
  fetchCategories: () => Promise<any[]>;
  fetchBanners: () => Promise<any[]>;
  fetchNotifications: () => Promise<any[]>;
}

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

export type RootStore = AuthState &
  AuthActions &
  CartState &
  CartActions &
  OrderState &
  OrderActions &
  ReviewState &
  ReviewActions &
  FeedState &
  FeedActions &
  ChatState &
  ChatActions;
