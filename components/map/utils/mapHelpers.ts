import { Dimensions } from "react-native";
import { Restaurant } from "@/stores/useRestaurantStore";

// ─── Text ──────────────────────────────────────────────────────────────────
export const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const normalizeRestaurantSearchQuery = (query: string): string =>
  normalizeText(query);

// ─── Formatting ────────────────────────────────────────────────────────────
export const formatRestaurantDistance = (distanceKm: number): string => {
  const dist = Number(distanceKm);
  if (!Number.isFinite(dist) || dist <= 0) return "0\u00A0miles";
  const formatted = dist % 1 === 0 ? dist.toFixed(0) : dist.toFixed(1);
  return `${formatted}\u00A0miles`;
};

export const formatRadius = (meters: number): string => {
  const m = Number(meters);
  if (!Number.isFinite(m) || m <= 0) return "0\u00A0miles";
  const miles = m / 1000;
  const formatted = miles % 1 === 0 ? miles.toFixed(0) : miles.toFixed(1);
  return `${formatted}\u00A0miles`;
};

// ─── Numbers ───────────────────────────────────────────────────────────────
export const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

// ─── Coordinates ───────────────────────────────────────────────────────────
export const getRestaurantCoords = (restaurant: Restaurant | null) => {
  if (!restaurant) return null;
  const lat = toNumber(
    restaurant.location?.lat ??
      (restaurant as any).latitude ??
      (restaurant as any).lat,
    NaN,
  );
  const lng = toNumber(
    restaurant.location?.lng ??
      (restaurant as any).longitude ??
      (restaurant as any).lng,
    NaN,
  );
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { latitude: lat, longitude: lng };
};

// ─── Images ────────────────────────────────────────────────────────────────
export const getRestaurantImage = (restaurant: Restaurant): string =>
  (restaurant.profile as string) ||
  (restaurant as any).image ||
  (restaurant as any).imageUrl ||
  "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=500";

// ─── Search ────────────────────────────────────────────────────────────────
export const buildRestaurantSearchHaystack = (
  restaurant: Restaurant,
): string => {
  const parts = [
    restaurant.restaurantName,
    restaurant.restaurantAddress,
    restaurant.city,
    restaurant.state,
    restaurant.contactEmail,
    restaurant.phoneNumber,
    (restaurant as any).providerName,
    (restaurant as any).name,
    restaurant.title,
    restaurant.mealName,
    Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(" ") : "",
  ];
  return normalizeText(parts.filter(Boolean).join(" "));
};

// ─── Layout constants ──────────────────────────────────────────────────────
export const { width: SCREEN_WIDTH } = Dimensions.get("window");
export const CARD_WIDTH = SCREEN_WIDTH * 0.82;
export const CARD_GAP = 12;
export const CARD_SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
export const RADIUS_STEPS = [300, 500, 1000, 2000, 5000, 10000];
