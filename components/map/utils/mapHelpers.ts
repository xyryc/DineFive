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
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return "0 m";
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(1)} km`;
};

export const formatRadius = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
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
    restaurant.location?.lat ?? (restaurant as any).latitude ?? (restaurant as any).lat,
    NaN,
  );
  const lng = toNumber(
    restaurant.location?.lng ?? (restaurant as any).longitude ?? (restaurant as any).lng,
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
export const buildRestaurantSearchHaystack = (restaurant: Restaurant): string => {
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
export const RADIUS_STEPS = [100, 200, 500, 1000, 2000, 5000, 10000];
