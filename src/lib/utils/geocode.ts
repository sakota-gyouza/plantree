import { PrefectureShape, geoToSvg } from "@/data/prefectures";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export interface GeocodeSuggestion {
  name: string;
  address: string;
  lat: number;
  lon: number;
  position: { x: number; y: number };
  isUserSpot?: boolean;
}

/** Strip sub-region suffix like "沖縄県（沖縄本島周辺）" → "沖縄県" */
function basePrefName(name: string): string {
  return name.replace(/（.*）$/, "");
}

// --- User spot database (localStorage for now, Supabase later) ---

interface UserSpotEntry {
  name: string;
  address: string;
  lat: number;
  lon: number;
  prefectureCode: number;
}

const USER_SPOTS_KEY = "plantree_user_spots";

function getUserSpots(): UserSpotEntry[] {
  try {
    const raw = localStorage.getItem(USER_SPOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUserSpots(spots: UserSpotEntry[]) {
  localStorage.setItem(USER_SPOTS_KEY, JSON.stringify(spots));
}

/**
 * Save a user-entered spot for future searches.
 */
export function rememberUserSpot(
  name: string,
  address: string,
  lat: number,
  lon: number,
  prefectureCode: number
) {
  const spots = getUserSpots();
  // Avoid duplicates by name+prefecture
  const exists = spots.some(
    (s) => s.name === name && s.prefectureCode === prefectureCode
  );
  if (!exists) {
    spots.push({ name, address, lat, lon, prefectureCode });
    saveUserSpots(spots);
  }
}

/**
 * Search user-saved spots by partial name match.
 */
function searchUserSpots(
  query: string,
  prefectureCode: number,
  prefecture: PrefectureShape
): GeocodeSuggestion[] {
  if (!prefecture.geo) return [];
  const q = query.toLowerCase();
  return getUserSpots()
    .filter(
      (s) =>
        s.prefectureCode === prefectureCode &&
        s.name.toLowerCase().includes(q)
    )
    .slice(0, 3)
    .map((s) => {
      const [svgX, svgY] = geoToSvg(prefecture, s.lon, s.lat);
      return {
        name: s.name,
        address: s.address,
        lat: s.lat,
        lon: s.lon,
        position: { x: Math.round(svgX), y: Math.round(svgY) },
        isUserSpot: true,
      };
    });
}

/**
 * Search for place suggestions within a prefecture.
 * Sources: user-saved spots + Nominatim (two parallel queries).
 * Returns up to 8 deduplicated candidates, user spots first.
 */
export async function searchPlaces(
  query: string,
  prefecture: PrefectureShape,
  prefectureCode?: number
): Promise<GeocodeSuggestion[]> {
  try {
    if (!query.trim() || !prefecture.geo) return [];

    // Search user-saved spots first
    const userResults = prefectureCode
      ? searchUserSpots(query, prefectureCode, prefecture)
      : [];

    const prefName = basePrefName(prefecture.name);
    const geo = prefecture.geo;
    const viewbox = `${geo.minLon},${geo.maxLat},${geo.maxLon},${geo.minLat}`;

    // Search 1: query + prefecture name, biased to area
    const url1 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${query} ${prefName}`)}&countrycodes=jp&viewbox=${viewbox}&bounded=0&limit=5`;
    // Search 2: query only, strictly bounded to prefecture area (catches local places)
    const url2 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=jp&viewbox=${viewbox}&bounded=1&limit=5`;

    const [res1, res2] = await Promise.all([
      fetch(url1, { headers: { "User-Agent": "Plantree/1.0" } }),
      fetch(url2, { headers: { "User-Agent": "Plantree/1.0" } }),
    ]);

    const results1: NominatimResult[] = res1.ok ? await res1.json() : [];
    const results2: NominatimResult[] = res2.ok ? await res2.json() : [];

    // Filter results to be within the prefecture geo bounds (with some margin)
    const margin = 0.5; // degrees
    const inBounds = (r: NominatimResult) => {
      const lat = parseFloat(r.lat);
      const lon = parseFloat(r.lon);
      return (
        lat >= geo.minLat - margin &&
        lat <= geo.maxLat + margin &&
        lon >= geo.minLon - margin &&
        lon <= geo.maxLon + margin
      );
    };

    // Merge and deduplicate by lat+lon
    const seen = new Set<string>();
    const merged: NominatimResult[] = [];
    for (const r of [...results1, ...results2]) {
      const key = `${r.lat},${r.lon}`;
      if (!seen.has(key) && inBounds(r)) {
        seen.add(key);
        merged.push(r);
      }
    }

    // Add user spots first, then Nominatim results
    const seen2 = new Set(userResults.map((u) => u.name.toLowerCase()));
    const nominatimSuggestions = merged
      .slice(0, 8 - userResults.length)
      .map((r) => {
        const lat = parseFloat(r.lat);
        const lon = parseFloat(r.lon);
        const [svgX, svgY] = geoToSvg(prefecture, lon, lat);
        const name = r.display_name.split(",")[0].trim();
        return {
          name,
          address: r.display_name,
          lat,
          lon,
          position: { x: Math.round(svgX), y: Math.round(svgY) },
        };
      })
      .filter((s) => !seen2.has(s.name.toLowerCase()));

    return [...userResults, ...nominatimSuggestions];
  } catch {
    return [];
  }
}

/**
 * Geocode an address string within a prefecture.
 * Returns SVG coordinates + lat/lon, or null.
 */
// Simplify Japanese address for Nominatim (remove 字, 番地, 号 etc.)
function simplifyAddress(addr: string): string[] {
  const candidates: string[] = [addr];
  // Remove 番地, 号, 字 and trailing numbers
  const simplified = addr
    .replace(/[字大字]/g, "")
    .replace(/\d+番地?/g, "")
    .replace(/\d+号/g, "")
    .replace(/[-ー−]\d+/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (simplified && simplified !== addr) candidates.push(simplified);
  return candidates;
}

export async function geocodeAddress(
  address: string,
  prefecture: PrefectureShape
): Promise<{ x: number; y: number; lat: number; lon: number } | null> {
  if (!prefecture.geo) return null;

  const prefName = basePrefName(prefecture.name);
  const baseQueries = simplifyAddress(address);
  // Try with prefecture name prepended, then without
  const queries: string[] = [];
  for (const q of baseQueries) {
    if (!q.includes(prefName)) {
      queries.push(`${prefName}${q}`);
    }
    queries.push(q);
  }

  for (const q of queries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=jp&limit=1`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Plantree/1.0" },
      });
      if (!res.ok) continue;

      const results: NominatimResult[] = await res.json();
      if (results.length === 0) continue;

      const lat = parseFloat(results[0].lat);
      const lon = parseFloat(results[0].lon);
      const [svgX, svgY] = geoToSvg(prefecture, lon, lat);
      return { x: Math.round(svgX), y: Math.round(svgY), lat, lon };
    } catch {
      continue;
    }
  }
  return null;
}
