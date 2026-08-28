import {
  formatRadius,
  formatRestaurantDistance,
  normalizeRestaurantSearchQuery,
} from "@/components/map/utils/mapHelpers";

describe("Map Helpers", () => {
  it("formats radius in meters to readable string", () => {
    expect(formatRadius(300)).toBe("0.3\u00A0miles");
    expect(formatRadius(500)).toBe("0.5\u00A0miles");
    expect(formatRadius(1000)).toBe("1\u00A0miles");
    expect(formatRadius(2000)).toBe("2\u00A0miles");
    expect(formatRadius(5500)).toBe("5.5\u00A0miles");
  });

  it("formats restaurant distance to readable miles string", () => {
    expect(formatRestaurantDistance(0.3)).toBe("0.3\u00A0miles");
    expect(formatRestaurantDistance(1)).toBe("1\u00A0miles");
    expect(formatRestaurantDistance(2)).toBe("2\u00A0miles");
    expect(formatRestaurantDistance(1.5)).toBe("1.5\u00A0miles");
    expect(formatRestaurantDistance(0)).toBe("0\u00A0miles");
  });

  it("normalizes search query to lowercase and removes extra spaces", () => {
    expect(normalizeRestaurantSearchQuery("  Stake  House  ")).toBe("stake house");
    expect(normalizeRestaurantSearchQuery("PIZZA")).toBe("pizza");
  });
});
