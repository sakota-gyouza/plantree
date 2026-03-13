export type TravelMode = "walk" | "car" | "train";

const SPEEDS: Record<TravelMode, number> = {
  walk: 5,
  car: 40,
  train: 60,
};

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

export function estimateTime(distKm: number, mode: TravelMode): string {
  const hours = distKm / SPEEDS[mode];
  const totalMin = Math.round(hours * 60);
  if (totalMin < 1) return "1分";
  if (totalMin < 60) return `${totalMin}分`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}時間${m}分` : `${h}時間`;
}

export function defaultMode(distKm: number): TravelMode {
  if (distKm < 1) return "walk";
  return "car";
}
