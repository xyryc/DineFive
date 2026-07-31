import { formatRadius, normalizeRestaurantSearchQuery } from "@/components/map/utils/mapHelpers";

describe("Map Helpers", () => {
  it("formats radius in meters to readable string", () => {
    expect(formatRadius(500)).toBe("500m");
    expect(formatRadius(1000)).toBe("1.0km");
    expect(formatRadius(5500)).toBe("5.5km");
  });

  it("normalizes search query to lowercase and removes extra spaces", () => {
    expect(normalizeRestaurantSearchQuery("  Stake  House  ")).toBe("stake house");
    expect(normalizeRestaurantSearchQuery("PIZZA")).toBe("pizza");
  });
});
