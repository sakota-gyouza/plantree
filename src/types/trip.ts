export type SpotIcon =
  | "shrine"
  | "temple"
  | "food"
  | "cafe"
  | "shopping"
  | "nature"
  | "museum"
  | "hotel"
  | "station"
  | "photo"
  | "transport"
  | "park"
  | "amusement"
  | "other";

export interface Spot {
  id: string;
  name: string;
  notes?: string;
  icon: SpotIcon;
  time?: string; // "HH:MM" format, optional
  position: {
    x: number;
    y: number;
  };
  lat?: number;
  lon?: number;
  color?: string;
  order: number;
  day: number;
  noPin?: boolean;
}

export interface DayInfo {
  label?: string; // custom label like "2025/4/10" or null for default "1日目"
  prefectureCode?: number; // 日ごとの都道府県（未設定ならtrip全体の値）
  subRegion?: string; // 日ごとのサブリージョン
}

export interface Trip {
  id: string;
  name: string;
  prefectureCode: number;
  subRegion?: string;
  date?: string;
  days: number;
  dayInfos?: DayInfo[]; // index 0 = day 1, optional overrides
  coverImageUrl?: string;
  isPublic?: boolean;
  spots: Spot[];
  createdAt: string;
  updatedAt: string;
}
