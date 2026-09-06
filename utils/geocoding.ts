export interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  lat: number;
  lng: number;
  displayName: string;
}

export interface GeocodeSearchResult {
  id: string;
  displayName: string;
  secondaryText: string;
  parsed: ParsedAddress;
}

// US State names to 2-letter postal codes
const US_STATE_MAP: Record<string, string> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
  'district of columbia': 'DC',
};

export function normalizeStateCode(stateName?: string): string {
  if (!stateName) return '';
  const trimmed = stateName.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  const lower = trimmed.toLowerCase();
  return US_STATE_MAP[lower] || trimmed;
}

function parseNominatimAddress(rawAddress: any, rawLat: any, rawLon: any, rawDisplayName: string): ParsedAddress {
  const addr = rawAddress || {};
  
  // Extract street address
  const houseNumber = addr.house_number || addr.street_number || '';
  const road = addr.road || addr.street || addr.pedestrian || addr.footway || addr.path || addr.avenue || addr.highway || '';
  let street = '';
  if (houseNumber && road) {
    street = `${houseNumber} ${road}`.trim();
  } else if (road) {
    street = road.trim();
  } else if (addr.commercial || addr.industrial || addr.retail || addr.amenity || addr.building) {
    street = (addr.commercial || addr.industrial || addr.retail || addr.amenity || addr.building || '').trim();
  }

  // Extract city (with fallback chain)
  const city = addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.hamlet ||
    addr.suburb ||
    addr.county ||
    '';

  // Extract state & normalize code
  const rawState = addr.state || addr.province || addr.region || '';
  const state = normalizeStateCode(rawState);

  // Extract zip code
  const zipCode = addr.postcode || addr.postal_code || '';

  // Extract country
  const country = addr.country || 'United States';

  const lat = parseFloat(rawLat) || 0;
  const lng = parseFloat(rawLon) || 0;

  return {
    street,
    city,
    state,
    zipCode,
    country,
    lat,
    lng,
    displayName: rawDisplayName || '',
  };
}

// In-memory cache for fast repeat searches
const searchCache = new Map<string, GeocodeSearchResult[]>();
const MAX_CACHE_SIZE = 50;

/**
 * Searches OpenStreetMap Nominatim for address suggestions in the United States
 */
export async function searchAddresses(query: string, signal?: AbortSignal): Promise<GeocodeSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const cacheKey = trimmed.toLowerCase();
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', trimmed);
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('countrycodes', 'us'); // Restrict to US for highly relevant suggestions
    url.searchParams.set('limit', '6');
    url.searchParams.set('accept-language', 'en');

    const res = await fetch(url.toString(), {
      signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DineFive-Customer-App/1.0',
      },
    });

    if (!res.ok) {
      throw new Error(`Nominatim search failed: HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const results: GeocodeSearchResult[] = data.map((item: any, idx: number) => {
      const parsed = parseNominatimAddress(item.address, item.lat, item.lon, item.display_name);
      
      const parts = item.display_name ? item.display_name.split(', ') : [];
      const primaryText = parts.length > 0 ? parts[0] : (parsed.street || parsed.city || trimmed);
      const secondaryText = parts.length > 1 ? parts.slice(1).join(', ') : `${parsed.city}, ${parsed.state} ${parsed.zipCode}`;

      return {
        id: String(item.place_id || `${item.lat}_${item.lon}_${idx}`),
        displayName: primaryText,
        secondaryText,
        parsed,
      };
    });

    if (searchCache.size >= MAX_CACHE_SIZE) {
      const firstKey = searchCache.keys().next().value;
      if (firstKey) searchCache.delete(firstKey);
    }
    searchCache.set(cacheKey, results);

    return results;
  } catch (err: any) {
    if (err.name === 'AbortError') return [];
    console.warn('[geocoding.searchAddresses] error:', err);
    return [];
  }
}

/**
 * Reverse geocodes latitude and longitude to street, city, state, zip code
 */
export async function reverseGeocodeCoordinates(lat: number, lng: number, signal?: AbortSignal): Promise<ParsedAddress | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('accept-language', 'en');

    const res = await fetch(url.toString(), {
      signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DineFive-Customer-App/1.0',
      },
    });

    if (!res.ok) {
      throw new Error(`Nominatim reverse failed: HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data || data.error) return null;

    return parseNominatimAddress(data.address, data.lat, data.lon, data.display_name);
  } catch (err: any) {
    if (err.name === 'AbortError') return null;
    console.warn('[geocoding.reverseGeocodeCoordinates] error:', err);
    return null;
  }
}
