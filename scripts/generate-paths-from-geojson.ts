/**
 * Generate prefecture SVG paths from Japan GeoJSON data.
 * Usage: npx tsx scripts/generate-paths-from-geojson.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";

interface GeoJSONFeature {
  type: "Feature";
  properties: Record<string, any>;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

interface GeoJSON {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

const PREFECTURE_META: Record<
  number,
  { name: string; nameEn: string; region: string; capital: string; capitalLon: number; capitalLat: number }
> = {
  1: { name: "北海道", nameEn: "Hokkaido", region: "hokkaido", capital: "札幌", capitalLon: 141.3469, capitalLat: 43.0642 },
  2: { name: "青森県", nameEn: "Aomori", region: "tohoku", capital: "青森", capitalLon: 140.74, capitalLat: 40.8244 },
  3: { name: "岩手県", nameEn: "Iwate", region: "tohoku", capital: "盛岡", capitalLon: 141.1527, capitalLat: 39.7036 },
  4: { name: "宮城県", nameEn: "Miyagi", region: "tohoku", capital: "仙台", capitalLon: 140.8719, capitalLat: 38.2688 },
  5: { name: "秋田県", nameEn: "Akita", region: "tohoku", capital: "秋田", capitalLon: 140.1023, capitalLat: 39.72 },
  6: { name: "山形県", nameEn: "Yamagata", region: "tohoku", capital: "山形", capitalLon: 140.3289, capitalLat: 38.2405 },
  7: { name: "福島県", nameEn: "Fukushima", region: "tohoku", capital: "福島", capitalLon: 140.4676, capitalLat: 37.7503 },
  8: { name: "茨城県", nameEn: "Ibaraki", region: "kanto", capital: "水戸", capitalLon: 140.4468, capitalLat: 36.3418 },
  9: { name: "栃木県", nameEn: "Tochigi", region: "kanto", capital: "宇都宮", capitalLon: 139.8836, capitalLat: 36.5658 },
  10: { name: "群馬県", nameEn: "Gunma", region: "kanto", capital: "前橋", capitalLon: 139.0609, capitalLat: 36.3912 },
  11: { name: "埼玉県", nameEn: "Saitama", region: "kanto", capital: "さいたま", capitalLon: 139.6489, capitalLat: 35.8617 },
  12: { name: "千葉県", nameEn: "Chiba", region: "kanto", capital: "千葉", capitalLon: 140.1233, capitalLat: 35.6047 },
  13: { name: "東京都", nameEn: "Tokyo", region: "kanto", capital: "東京", capitalLon: 139.6917, capitalLat: 35.6895 },
  14: { name: "神奈川県", nameEn: "Kanagawa", region: "kanto", capital: "横浜", capitalLon: 139.6425, capitalLat: 35.4478 },
  15: { name: "新潟県", nameEn: "Niigata", region: "chubu", capital: "新潟", capitalLon: 139.0236, capitalLat: 37.9026 },
  16: { name: "富山県", nameEn: "Toyama", region: "chubu", capital: "富山", capitalLon: 137.2114, capitalLat: 36.6953 },
  17: { name: "石川県", nameEn: "Ishikawa", region: "chubu", capital: "金沢", capitalLon: 136.6256, capitalLat: 36.5947 },
  18: { name: "福井県", nameEn: "Fukui", region: "chubu", capital: "福井", capitalLon: 136.2219, capitalLat: 36.0652 },
  19: { name: "山梨県", nameEn: "Yamanashi", region: "chubu", capital: "甲府", capitalLon: 138.5684, capitalLat: 35.6639 },
  20: { name: "長野県", nameEn: "Nagano", region: "chubu", capital: "長野", capitalLon: 138.1811, capitalLat: 36.6513 },
  21: { name: "岐阜県", nameEn: "Gifu", region: "chubu", capital: "岐阜", capitalLon: 136.7223, capitalLat: 35.3912 },
  22: { name: "静岡県", nameEn: "Shizuoka", region: "chubu", capital: "静岡", capitalLon: 138.3831, capitalLat: 34.9769 },
  23: { name: "愛知県", nameEn: "Aichi", region: "chubu", capital: "名古屋", capitalLon: 136.9066, capitalLat: 35.1802 },
  24: { name: "三重県", nameEn: "Mie", region: "kinki", capital: "津", capitalLon: 136.5086, capitalLat: 34.7303 },
  25: { name: "滋賀県", nameEn: "Shiga", region: "kinki", capital: "大津", capitalLon: 135.8685, capitalLat: 35.0045 },
  26: { name: "京都府", nameEn: "Kyoto", region: "kinki", capital: "京都", capitalLon: 135.7681, capitalLat: 35.0116 },
  27: { name: "大阪府", nameEn: "Osaka", region: "kinki", capital: "大阪", capitalLon: 135.5023, capitalLat: 34.6937 },
  28: { name: "兵庫県", nameEn: "Hyogo", region: "kinki", capital: "神戸", capitalLon: 135.183, capitalLat: 34.6913 },
  29: { name: "奈良県", nameEn: "Nara", region: "kinki", capital: "奈良", capitalLon: 135.8048, capitalLat: 34.6851 },
  30: { name: "和歌山県", nameEn: "Wakayama", region: "kinki", capital: "和歌山", capitalLon: 135.1675, capitalLat: 34.226 },
  31: { name: "鳥取県", nameEn: "Tottori", region: "chugoku", capital: "鳥取", capitalLon: 134.2383, capitalLat: 35.5039 },
  32: { name: "島根県", nameEn: "Shimane", region: "chugoku", capital: "松江", capitalLon: 133.0505, capitalLat: 35.4723 },
  33: { name: "岡山県", nameEn: "Okayama", region: "chugoku", capital: "岡山", capitalLon: 133.9347, capitalLat: 34.6618 },
  34: { name: "広島県", nameEn: "Hiroshima", region: "chugoku", capital: "広島", capitalLon: 132.4596, capitalLat: 34.3966 },
  35: { name: "山口県", nameEn: "Yamaguchi", region: "chugoku", capital: "山口", capitalLon: 131.4714, capitalLat: 34.1861 },
  36: { name: "徳島県", nameEn: "Tokushima", region: "shikoku", capital: "徳島", capitalLon: 134.5594, capitalLat: 34.0658 },
  37: { name: "香川県", nameEn: "Kagawa", region: "shikoku", capital: "高松", capitalLon: 134.0434, capitalLat: 34.3401 },
  38: { name: "愛媛県", nameEn: "Ehime", region: "shikoku", capital: "松山", capitalLon: 132.7657, capitalLat: 33.8416 },
  39: { name: "高知県", nameEn: "Kochi", region: "shikoku", capital: "高知", capitalLon: 133.5311, capitalLat: 33.5597 },
  40: { name: "福岡県", nameEn: "Fukuoka", region: "kyushu", capital: "福岡", capitalLon: 130.4017, capitalLat: 33.5904 },
  41: { name: "佐賀県", nameEn: "Saga", region: "kyushu", capital: "佐賀", capitalLon: 130.2988, capitalLat: 33.2494 },
  42: { name: "長崎県", nameEn: "Nagasaki", region: "kyushu", capital: "長崎", capitalLon: 129.8737, capitalLat: 32.7503 },
  43: { name: "熊本県", nameEn: "Kumamoto", region: "kyushu", capital: "熊本", capitalLon: 130.7417, capitalLat: 32.7898 },
  44: { name: "大分県", nameEn: "Oita", region: "kyushu", capital: "大分", capitalLon: 131.6126, capitalLat: 33.2382 },
  45: { name: "宮崎県", nameEn: "Miyazaki", region: "kyushu", capital: "宮崎", capitalLon: 131.4239, capitalLat: 31.9111 },
  46: { name: "鹿児島県", nameEn: "Kagoshima", region: "kyushu", capital: "鹿児島", capitalLon: 130.5581, capitalLat: 31.5602 },
  47: { name: "沖縄県", nameEn: "Okinawa", region: "kyushu", capital: "那覇", capitalLon: 127.6809, capitalLat: 26.2124 },
};

function download(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const get = (u: string) => {
      https.get(u, { headers: { "User-Agent": "plantree-script" } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          get(res.headers.location);
          return;
        }
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error("HTTP " + res.statusCode + " for " + u));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        res.on("error", reject);
      }).on("error", reject);
    };
    get(url);
  });
}

function extractPolygons(feature: GeoJSONFeature): number[][][] {
  const geom = feature.geometry;
  if (geom.type === "Polygon") {
    return [(geom.coordinates as number[][][])[0]];
  }
  return (geom.coordinates as number[][][][]).map((poly) => poly[0]);
}

function ringArea(ring: number[][]): number {
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length;
    area += ring[i][0] * ring[j][1];
    area -= ring[j][0] * ring[i][1];
  }
  return Math.abs(area / 2);
}

function simplifyRing(ring: number[][], tolerance: number): number[][] {
  if (ring.length <= 4) return ring;

  function dpRecurse(points: number[][], first: number, last: number, keep: boolean[]): void {
    let maxDist = 0;
    let maxIdx = first;
    const [ax, ay] = points[first];
    const [bx, by] = points[last];
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;

    for (let i = first + 1; i < last; i++) {
      let dist: number;
      if (lenSq === 0) {
        const ex = points[i][0] - ax;
        const ey = points[i][1] - ay;
        dist = Math.sqrt(ex * ex + ey * ey);
      } else {
        const t = Math.max(0, Math.min(1, ((points[i][0] - ax) * dx + (points[i][1] - ay) * dy) / lenSq));
        const px = ax + t * dx;
        const py = ay + t * dy;
        const ex = points[i][0] - px;
        const ey = points[i][1] - py;
        dist = Math.sqrt(ex * ex + ey * ey);
      }
      if (dist > maxDist) {
        maxDist = dist;
        maxIdx = i;
      }
    }

    if (maxDist > tolerance) {
      keep[maxIdx] = true;
      dpRecurse(points, first, maxIdx, keep);
      dpRecurse(points, maxIdx, last, keep);
    }
  }

  const keep = new Array(ring.length).fill(false);
  keep[0] = true;
  keep[ring.length - 1] = true;
  dpRecurse(ring, 0, ring.length - 1, keep);

  return ring.filter((_: number[], i: number) => keep[i]);
}

function ringToBezierPath(svgPoints: [number, number][]): string {
  if (svgPoints.length < 2) return "";

  const pts = svgPoints.slice();
  const last = pts[pts.length - 1];
  const first = pts[0];
  if (Math.abs(last[0] - first[0]) < 0.5 && Math.abs(last[1] - first[1]) < 0.5) {
    pts.pop();
  }
  if (pts.length < 3) {
    let d = "M " + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
    for (let i = 1; i < pts.length; i++) {
      d += " L " + pts[i][0].toFixed(1) + " " + pts[i][1].toFixed(1);
    }
    return d + " Z";
  }

  const n = pts.length;
  let d = "M " + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);

  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += " C " + cp1x.toFixed(1) + " " + cp1y.toFixed(1) + ", " + cp2x.toFixed(1) + " " + cp2y.toFixed(1) + ", " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
  }

  return d + " Z";
}

function findCodeByName(name: string): number | null {
  if (!name) return null;
  const cleaned = name.replace(/[県府都道]$/, "");
  for (const [codeStr, meta] of Object.entries(PREFECTURE_META)) {
    const metaCleaned = meta.name.replace(/[県府都道]$/, "");
    if (metaCleaned === cleaned || meta.name === name || meta.name === cleaned) {
      return Number(codeStr);
    }
  }
  return null;
}

async function main() {
  console.log("Downloading Japan GeoJSON...");
  const raw = await download("https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson");
  const geojson: GeoJSON = JSON.parse(raw);
  console.log(`Got ${geojson.features.length} features`);

  const TARGET_WIDTH = 300;
  const PADDING = 15;
  const results: Record<number, any> = {};
  // Store raw rings per prefecture for sub-region processing
  const rawRings: Record<number, number[][][]> = {};

  for (const feature of geojson.features) {
    const props = feature.properties;
    const jaName = props.nam || props.nam_ja || props.name || props.NAME || "";
    let code = findCodeByName(jaName);
    if (!code && props.id) {
      const id = Number(props.id);
      if (PREFECTURE_META[id]) code = id;
    }
    if (!code) {
      console.warn(`  SKIP: ${JSON.stringify(props)}`);
      continue;
    }

    const meta = PREFECTURE_META[code];
    const rings = extractPolygons(feature);
    rawRings[code] = rings;

    const ringsWithArea = rings
      .map((ring) => ({ ring, area: ringArea(ring) }))
      .sort((a, b) => b.area - a.area);

    // Use ALL polygons for bounds so every island is included
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const { ring } of ringsWithArea) {
      for (const coord of ring) {
        if (coord[0] < minLon) minLon = coord[0];
        if (coord[0] > maxLon) maxLon = coord[0];
        if (coord[1] < minLat) minLat = coord[1];
        if (coord[1] > maxLat) maxLat = coord[1];
      }
    }

    // Calculate main island bounds for initial focus
    const mainRing = ringsWithArea[0].ring;
    let mainMinLon = Infinity, mainMaxLon = -Infinity, mainMinLat = Infinity, mainMaxLat = -Infinity;
    for (const coord of mainRing) {
      if (coord[0] < mainMinLon) mainMinLon = coord[0];
      if (coord[0] > mainMaxLon) mainMaxLon = coord[0];
      if (coord[1] < mainMinLat) mainMinLat = coord[1];
      if (coord[1] > mainMaxLat) mainMaxLat = coord[1];
    }
    // Include nearby islands in the focus area (within 1.5x main island span)
    const lonSpan = mainMaxLon - mainMinLon;
    const latSpan = mainMaxLat - mainMinLat;
    const marginLon = lonSpan * 0.75;
    const marginLat = latSpan * 0.75;
    for (const { ring } of ringsWithArea.slice(1)) {
      const centerLon = ring.reduce((s, c) => s + c[0], 0) / ring.length;
      const centerLat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
      if (centerLon >= mainMinLon - marginLon && centerLon <= mainMaxLon + marginLon &&
          centerLat >= mainMinLat - marginLat && centerLat <= mainMaxLat + marginLat) {
        for (const coord of ring) {
          if (coord[0] < mainMinLon) mainMinLon = coord[0];
          if (coord[0] > mainMaxLon) mainMaxLon = coord[0];
          if (coord[1] < mainMinLat) mainMinLat = coord[1];
          if (coord[1] > mainMaxLat) mainMaxLat = coord[1];
        }
      }
    }

    const lonRange = maxLon - minLon || 0.01;
    const latRange = maxLat - minLat || 0.01;
    const usableSize = TARGET_WIDTH - 2 * PADDING;
    const scaleX = usableSize / lonRange;
    const scaleY = usableSize / latRange;
    const scale = Math.min(scaleX, scaleY);

    const svgWidth = Math.round(lonRange * scale + 2 * PADDING);
    const svgHeight = Math.round(latRange * scale + 2 * PADDING);
    const offsetX = PADDING + (svgWidth - 2 * PADDING - lonRange * scale) / 2;
    const offsetY = PADDING + (svgHeight - 2 * PADDING - latRange * scale) / 2;

    function toSVG(lon: number, lat: number): [number, number] {
      return [
        (lon - minLon) * scale + offsetX,
        (maxLat - lat) * scale + offsetY,
      ];
    }

    const totalArea = rings.reduce((sum, r) => sum + ringArea(r), 0);
    let tolerance: number;
    if (totalArea > 1.0) tolerance = 0.004;
    else if (totalArea > 0.5) tolerance = 0.003;
    else if (totalArea > 0.2) tolerance = 0.002;
    else if (totalArea > 0.05) tolerance = 0.0015;
    else if (totalArea > 0.01) tolerance = 0.001;
    else tolerance = 0.0005;

    const sortedRings = rings
      .map((ring) => ({ ring, area: ringArea(ring) }))
      .sort((a, b) => b.area - a.area);

    const processedRings: { path: string; area: number }[] = [];
    for (const { ring, area } of sortedRings) {
      const t = area < sortedRings[0].area * 0.01 ? tolerance * 0.3 : tolerance;
      const simplified = simplifyRing(ring, t);
      if (simplified.length < 3) continue;
      const svgPts: [number, number][] = simplified.map(([lon, lat]) => toSVG(lon, lat));
      processedRings.push({ path: ringToBezierPath(svgPts), area });
    }

    if (processedRings.length === 0) continue;

    const mainPath = processedRings[0].path;
    const extraPaths = processedRings.slice(1).map((r) => ({ d: r.path }));
    const [cx, cy] = toSVG((minLon + maxLon) / 2, (minLat + maxLat) / 2);

    const landmarks: Record<string, [number, number]> = {};
    const [capX, capY] = toSVG(meta.capitalLon, meta.capitalLat);
    landmarks[meta.capital] = [Math.round(capX), Math.round(capY)];

    // Calculate focus area in SVG coords (main island + nearby islands)
    const [focusX1, focusY1] = toSVG(mainMinLon, mainMaxLat);
    const [focusX2, focusY2] = toSVG(mainMaxLon, mainMinLat);
    const focusPad = 10;
    const hasFocus = (mainMinLon !== minLon || mainMaxLon !== maxLon ||
                      mainMinLat !== minLat || mainMaxLat !== maxLat);

    results[code] = {
      code, name: meta.name, nameEn: meta.nameEn, region: meta.region,
      path: mainPath,
      extraPaths: extraPaths.length > 0 ? extraPaths : undefined,
      viewBox: `0 0 ${svgWidth} ${svgHeight}`,
      center: [Math.round(cx), Math.round(cy)] as [number, number],
      landmarks,
      geo: {
        minLon: Math.round(minLon * 10000) / 10000,
        maxLon: Math.round(maxLon * 10000) / 10000,
        minLat: Math.round(minLat * 10000) / 10000,
        maxLat: Math.round(maxLat * 10000) / 10000,
        scale: Math.round(scale * 1000) / 1000,
        offsetX: Math.round(offsetX * 100) / 100,
        offsetY: Math.round(offsetY * 100) / 100,
      },
      // Focus rect for initial zoom (SVG coords of main island area)
      ...(hasFocus ? {
        focus: {
          x: Math.round(focusX1 - focusPad),
          y: Math.round(focusY1 - focusPad),
          width: Math.round(focusX2 - focusX1 + focusPad * 2),
          height: Math.round(focusY2 - focusY1 + focusPad * 2),
        },
      } : {}),
    };
    console.log(`  ${code}: ${meta.nameEn} - ${processedRings.length} polygon(s), ${svgWidth}x${svgHeight}`);
  }

  // === Sub-region generation ===
  interface SubRegionBounds {
    id: string;
    name: string;
    bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number };
  }

  const SUB_REGIONS: Record<number, SubRegionBounds[]> = {
    13: [
      { id: "main", name: "本土", bounds: { minLat: 35.4, maxLat: 35.9, minLon: 138.8, maxLon: 140.0 } },
      { id: "ogasawara", name: "小笠原諸島", bounds: { minLat: 26.0, maxLat: 28.0, minLon: 141.0, maxLon: 143.0 } },
    ],
    46: [
      { id: "main", name: "本土", bounds: { minLat: 30.2, maxLat: 32.4, minLon: 129.3, maxLon: 131.3 } },
      { id: "amami", name: "奄美群島", bounds: { minLat: 27.0, maxLat: 29.5, minLon: 128.0, maxLon: 130.0 } },
    ],
    47: [
      { id: "main", name: "沖縄本島周辺", bounds: { minLat: 26.0, maxLat: 27.2, minLon: 126.6, maxLon: 128.4 } },
      { id: "miyako", name: "宮古諸島", bounds: { minLat: 24.2, maxLat: 25.0, minLon: 124.5, maxLon: 125.7 } },
      { id: "yaeyama", name: "八重山諸島", bounds: { minLat: 23.8, maxLat: 24.7, minLon: 122.8, maxLon: 124.5 } },
    ],
  };

  const subRegionResults: Record<string, any> = {};

  for (const [prefCodeStr, subRegions] of Object.entries(SUB_REGIONS)) {
    const prefCode = Number(prefCodeStr);
    const rings = rawRings[prefCode];
    if (!rings) continue;
    const meta = PREFECTURE_META[prefCode];

    for (const sr of subRegions) {
      // Filter polygons that fall within this sub-region's bounds
      const srRings = rings.filter((ring) => {
        const centerLon = ring.reduce((s, c) => s + c[0], 0) / ring.length;
        const centerLat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
        return (
          centerLat >= sr.bounds.minLat && centerLat <= sr.bounds.maxLat &&
          centerLon >= sr.bounds.minLon && centerLon <= sr.bounds.maxLon
        );
      });

      if (srRings.length === 0) {
        console.warn(`  Sub-region ${prefCode}-${sr.id}: no polygons found`);
        continue;
      }

      // Calculate bounds from the filtered polygons
      let srMinLon = Infinity, srMaxLon = -Infinity, srMinLat = Infinity, srMaxLat = -Infinity;
      for (const ring of srRings) {
        for (const coord of ring) {
          if (coord[0] < srMinLon) srMinLon = coord[0];
          if (coord[0] > srMaxLon) srMaxLon = coord[0];
          if (coord[1] < srMinLat) srMinLat = coord[1];
          if (coord[1] > srMaxLat) srMaxLat = coord[1];
        }
      }

      const srLonRange = srMaxLon - srMinLon || 0.01;
      const srLatRange = srMaxLat - srMinLat || 0.01;
      const srUsable = TARGET_WIDTH - 2 * PADDING;
      const srScaleX = srUsable / srLonRange;
      const srScaleY = srUsable / srLatRange;
      const srScale = Math.min(srScaleX, srScaleY);
      const srSvgW = Math.round(srLonRange * srScale + 2 * PADDING);
      const srSvgH = Math.round(srLatRange * srScale + 2 * PADDING);
      const srOffX = PADDING + (srSvgW - 2 * PADDING - srLonRange * srScale) / 2;
      const srOffY = PADDING + (srSvgH - 2 * PADDING - srLatRange * srScale) / 2;

      function srToSVG(lon: number, lat: number): [number, number] {
        return [
          (lon - srMinLon) * srScale + srOffX,
          (srMaxLat - lat) * srScale + srOffY,
        ];
      }

      const srTotalArea = srRings.reduce((sum, r) => sum + ringArea(r), 0);
      let srTolerance: number;
      if (srTotalArea > 1.0) srTolerance = 0.004;
      else if (srTotalArea > 0.5) srTolerance = 0.003;
      else if (srTotalArea > 0.2) srTolerance = 0.002;
      else if (srTotalArea > 0.05) srTolerance = 0.0015;
      else if (srTotalArea > 0.01) srTolerance = 0.001;
      else srTolerance = 0.0005;

      const srSorted = srRings
        .map((ring) => ({ ring, area: ringArea(ring) }))
        .sort((a, b) => b.area - a.area);

      const srProcessed: { path: string; area: number }[] = [];
      for (const { ring, area } of srSorted) {
        const t = area < srSorted[0].area * 0.01 ? srTolerance * 0.3 : srTolerance;
        const simplified = simplifyRing(ring, t);
        if (simplified.length < 3) continue;
        const svgPts: [number, number][] = simplified.map(([lon, lat]) => srToSVG(lon, lat));
        srProcessed.push({ path: ringToBezierPath(svgPts), area });
      }

      if (srProcessed.length === 0) continue;

      const srMainPath = srProcessed[0].path;
      const srExtraPaths = srProcessed.slice(1).map((r) => ({ d: r.path }));
      const [srCx, srCy] = srToSVG((srMinLon + srMaxLon) / 2, (srMinLat + srMaxLat) / 2);

      const key = `${prefCode}-${sr.id}`;
      subRegionResults[key] = {
        code: prefCode,
        name: `${meta.name}（${sr.name}）`,
        nameEn: `${meta.nameEn} - ${sr.id}`,
        region: meta.region,
        path: srMainPath,
        extraPaths: srExtraPaths.length > 0 ? srExtraPaths : undefined,
        viewBox: `0 0 ${srSvgW} ${srSvgH}`,
        center: [Math.round(srCx), Math.round(srCy)] as [number, number],
        landmarks: {},
        geo: {
          minLon: Math.round(srMinLon * 10000) / 10000,
          maxLon: Math.round(srMaxLon * 10000) / 10000,
          minLat: Math.round(srMinLat * 10000) / 10000,
          maxLat: Math.round(srMaxLat * 10000) / 10000,
          scale: Math.round(srScale * 1000) / 1000,
          offsetX: Math.round(srOffX * 100) / 100,
          offsetY: Math.round(srOffY * 100) / 100,
        },
      };
      console.log(`  Sub-region ${key}: ${sr.name} - ${srProcessed.length} polygon(s), ${srSvgW}x${srSvgH}`);
    }
  }

  // Generate output
  const outputPath = path.resolve(__dirname, "../src/data/prefectures/paths.ts");
  let ts = `// Auto-generated from Japan GeoJSON data
// Source: https://github.com/dataofjapan/land
// Generated: ${new Date().toISOString().split("T")[0]}
// Re-generate: npx tsx scripts/generate-paths-from-geojson.ts

export interface PrefectureShape {
  code: number;
  name: string;
  nameEn: string;
  region: string;
  path: string;
  beachPath?: string;
  extraPaths?: { d: string; fill?: string; stroke?: string }[];
  viewBox: string;
  center: [number, number];
  landmarks: Record<string, [number, number]>;
  geo?: {
    minLon: number;
    maxLon: number;
    minLat: number;
    maxLat: number;
    scale: number;
    offsetX: number;
    offsetY: number;
  };
  focus?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export function geoToSvg(pref: PrefectureShape, longitude: number, latitude: number): [number, number] {
  const g = pref.geo;
  if (!g) return pref.center;
  const x = (longitude - g.minLon) * g.scale + g.offsetX;
  const y = (g.maxLat - latitude) * g.scale + g.offsetY;
  return [Math.round(x), Math.round(y)];
}

export const prefectures: Record<number, PrefectureShape> = {\n`;

  const codes = Object.keys(results).map(Number).sort((a, b) => a - b);
  for (const code of codes) {
    const r = results[code];
    ts += `  ${code}: {\n`;
    ts += `    code: ${code},\n`;
    ts += `    name: ${JSON.stringify(r.name)},\n`;
    ts += `    nameEn: ${JSON.stringify(r.nameEn)},\n`;
    ts += `    region: ${JSON.stringify(r.region)},\n`;
    ts += `    path: ${JSON.stringify(r.path)},\n`;
    if (r.extraPaths) {
      ts += `    extraPaths: [\n`;
      for (const ep of r.extraPaths) {
        ts += `      { d: ${JSON.stringify(ep.d)} },\n`;
      }
      ts += `    ],\n`;
    }
    ts += `    viewBox: ${JSON.stringify(r.viewBox)},\n`;
    ts += `    center: [${r.center[0]}, ${r.center[1]}],\n`;
    ts += `    landmarks: {\n`;
    for (const [k, v] of Object.entries(r.landmarks)) {
      const coords = v as [number, number];
      ts += `      ${JSON.stringify(k)}: [${coords[0]}, ${coords[1]}],\n`;
    }
    ts += `    },\n`;
    ts += `    geo: {\n`;
    ts += `      minLon: ${r.geo.minLon},\n`;
    ts += `      maxLon: ${r.geo.maxLon},\n`;
    ts += `      minLat: ${r.geo.minLat},\n`;
    ts += `      maxLat: ${r.geo.maxLat},\n`;
    ts += `      scale: ${r.geo.scale},\n`;
    ts += `      offsetX: ${r.geo.offsetX},\n`;
    ts += `      offsetY: ${r.geo.offsetY},\n`;
    ts += `    },\n`;
    if (r.focus) {
      ts += `    focus: { x: ${r.focus.x}, y: ${r.focus.y}, width: ${r.focus.width}, height: ${r.focus.height} },\n`;
    }
    ts += `  },\n`;
  }
  ts += `};\n\n`;

  // Sub-region prefectures
  ts += `export const subRegionPrefectures: Record<string, PrefectureShape> = {\n`;
  const srKeys = Object.keys(subRegionResults).sort();
  for (const key of srKeys) {
    const r = subRegionResults[key];
    ts += `  ${JSON.stringify(key)}: {\n`;
    ts += `    code: ${r.code},\n`;
    ts += `    name: ${JSON.stringify(r.name)},\n`;
    ts += `    nameEn: ${JSON.stringify(r.nameEn)},\n`;
    ts += `    region: ${JSON.stringify(r.region)},\n`;
    ts += `    path: ${JSON.stringify(r.path)},\n`;
    if (r.extraPaths) {
      ts += `    extraPaths: [\n`;
      for (const ep of r.extraPaths) {
        ts += `      { d: ${JSON.stringify(ep.d)} },\n`;
      }
      ts += `    ],\n`;
    }
    ts += `    viewBox: ${JSON.stringify(r.viewBox)},\n`;
    ts += `    center: [${r.center[0]}, ${r.center[1]}],\n`;
    ts += `    landmarks: {},\n`;
    ts += `    geo: {\n`;
    ts += `      minLon: ${r.geo.minLon},\n`;
    ts += `      maxLon: ${r.geo.maxLon},\n`;
    ts += `      minLat: ${r.geo.minLat},\n`;
    ts += `      maxLat: ${r.geo.maxLat},\n`;
    ts += `      scale: ${r.geo.scale},\n`;
    ts += `      offsetX: ${r.geo.offsetX},\n`;
    ts += `      offsetY: ${r.geo.offsetY},\n`;
    ts += `    },\n`;
    ts += `  },\n`;
  }
  ts += `};\n\n`;

  // Helper function
  ts += `export function getPrefecture(code: number, subRegion?: string): PrefectureShape | undefined {\n`;
  ts += `  if (subRegion) {\n`;
  ts += `    const key = \`\${code}-\${subRegion}\`;\n`;
  ts += `    return subRegionPrefectures[key] || prefectures[code];\n`;
  ts += `  }\n`;
  ts += `  return prefectures[code];\n`;
  ts += `}\n`;

  fs.writeFileSync(outputPath, ts, "utf-8");
  console.log(`\nWritten to ${outputPath}`);
  console.log(`Total: ${codes.length} prefectures`);

  const missing = Object.keys(PREFECTURE_META).map(Number).filter((c) => !results[c]);
  if (missing.length > 0) {
    console.warn(`Missing: ${missing.map((c) => `${c}(${PREFECTURE_META[c].nameEn})`).join(", ")}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
