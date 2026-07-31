import { createCartSlice } from "@/stores/slices/cartSlice";

describe("Cart Store Slice", () => {
  let cartStore: ReturnType<typeof createCartSlice>;
  let mockSet: jest.Mock;
  let mockGet: jest.Mock;

  beforeEach(() => {
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
      accessToken: "mock-token",
      requestWithAuth: jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { items: [], count: 0 } }),
      }),
    }));

    cartStore = createCartSlice(mockSet, mockGet);
  });

  it("starts with empty cartItems array and cartCount 0", () => {
    expect(cartStore.cartItems).toEqual([]);
    expect(cartStore.cartCount).toBe(0);
  });

  it("adds item to cart using addToCart API slice action", async () => {
    const item = {
      _id: "food-101",
      name: "Crispy Chicken Meal",
      price: 15.99,
    };

    const result = await cartStore.addToCart(item, 2);
    expect(result).toBeDefined();
    expect(mockSet).toHaveBeenCalled();
  });
});
