export interface SubRegionDef {
  id: string;
  name: string;
  // Geographic bounds for polygon assignment
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

export const prefectureSubRegions: Record<number, SubRegionDef[]> = {
  13: [
    { id: "main", name: "本土", bounds: { minLat: 35.4, maxLat: 35.9, minLon: 138.8, maxLon: 140.0 } },
    { id: "ogasawara", name: "小笠原諸島", bounds: { minLat: 26.0, maxLat: 28.0, minLon: 141.0, maxLon: 143.0 } },
  ],
  46: [
    { id: "main", name: "本土", bounds: { minLat: 30.2, maxLat: 32.4, minLon: 129.3, maxLon: 131.3 } },
    { id: "amami", name: "奄美群島", bounds: { minLat: 27.0, maxLat: 29.5, minLon: 128.0, maxLon: 130.0 } },
  ],
  47: [
    { id: "main", name: "沖縄本島周辺", bounds: { minLat: 26.05, maxLat: 26.95, minLon: 127.4, maxLon: 128.3 } },
    { id: "miyako", name: "宮古諸島 (宮古島等)", bounds: { minLat: 24.2, maxLat: 25.0, minLon: 124.5, maxLon: 125.7 } },
    { id: "yaeyama", name: "八重山諸島 (石垣島等)", bounds: { minLat: 23.8, maxLat: 24.7, minLon: 122.8, maxLon: 124.5 } },
  ],
};
