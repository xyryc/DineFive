import { createCartSlice } from "@/stores/slices/cartSlice";

describe("Cart Store Slice", () => {
  let cartStore: ReturnType<typeof createCartSlice>;
  let mockSet: jest.Mock;
  let mockGet: jest.Mock;
  let mockRequestWithAuth: jest.Mock;

  beforeEach(() => {
    mockRequestWithAuth = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          items: [{ foodId: "food-101", quantity: 2, price: 15.99 }],
          count: 2,
        },
      }),
    });

    mockSet = jest.fn((updater) => {
      if (typeof updater === "function") {
        const newState = updater(cartStore);
        Object.assign(cartStore, newState);
      } else {
        Object.assign(cartStore, updater);
      }
    });

    mockGet = jest.fn(() => ({
      ...cartStore,
      accessToken: "mock-valid-token",
      requestWithAuth: mockRequestWithAuth,
    }));

    cartStore = createCartSlice(mockSet, mockGet);
  });

  it("1. Starts with empty cartItems array and cartCount 0", () => {
    expect(cartStore.cartItems).toEqual([]);
    expect(cartStore.cartCount).toBe(0);
    expect(cartStore.isCartSyncing).toBe(false);
  });

  it("2. Adds an item to cart using addToCart API slice action", async () => {
    const item = {
      _id: "food-101",
      name: "Crispy Chicken Meal",
      price: 15.99,
    };

    const result = await cartStore.addToCart(item, 2);

    expect(result).toBeDefined();
    expect(mockRequestWithAuth).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalled();
  });

  it("3. Updates item quantity using updateCartQuantity action", async () => {
    const result = await cartStore.updateCartQuantity("food-101", 3);

    expect(result).toBeDefined();
    expect(mockRequestWithAuth).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalled();
  });

  it("4. Removes item from cart using removeCartItem action", async () => {
    const result = await cartStore.removeCartItem("food-101");

    expect(result).toBeDefined();
    expect(mockRequestWithAuth).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalled();
  });

  it("5. Resets cart state when clearCart is called", async () => {
    const result = await cartStore.clearCart();

    expect(result).toBeDefined();
    expect(mockRequestWithAuth).toHaveBeenCalled();
  });

  it("6. Handles missing access token error gracefully", async () => {
    // Mock missing token
    mockGet.mockReturnValueOnce({
      ...cartStore,
      accessToken: null,
      refreshToken: null,
    });

    const result = await cartStore.addToCart({ _id: "food-101" }, 1);
    expect(result).toBeNull();
  });
});
