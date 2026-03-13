"use client";

import { useState } from "react";
import { prefectures, regions } from "@/data/prefectures";
import { prefectureSubRegions } from "@/data/prefectures/subRegions";
import { PrefectureThumbnail } from "./PrefectureThumbnail";
import { ArrowLeft } from "lucide-react";

interface PrefectureSelectorProps {
  onSelect: (code: number, subRegion?: string) => void;
}

export function PrefectureSelector({ onSelect }: PrefectureSelectorProps) {
  const [search, setSearch] = useState("");
  const [subRegionFor, setSubRegionFor] = useState<number | null>(null);

  const filtered = Object.values(prefectures).filter(
    (p) =>
      p.name.includes(search) ||
      p.nameEn.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrefectureClick = (code: number) => {
    const subRegions = prefectureSubRegions[code];
    if (subRegions) {
      setSubRegionFor(code);
    } else {
      onSelect(code);
    }
  };

  // Sub-region selection screen
  if (subRegionFor !== null) {
    const pref = prefectures[subRegionFor];
    const subRegions = prefectureSubRegions[subRegionFor] || [];

    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={() => setSubRegionFor(null)}
          className="flex items-center gap-1 text-sm text-text-sub hover:text-coral transition-colors self-start"
        >
          <ArrowLeft size={14} />
          戻る
        </button>

        <h3 className="text-sm font-bold text-text text-center">
          {pref.name}のエリアを選択
        </h3>

        <div className="flex flex-col gap-2">
          {subRegions.map((sr) => (
            <button
              key={sr.id}
              onClick={() => onSelect(subRegionFor, sr.id)}
              className="px-4 py-3 bg-cream border-2 border-border rounded-2xl text-left hover:border-coral transition-colors"
            >
              <span className="text-sm font-bold text-text">{sr.name}</span>
            </button>
          ))}
          <button
            onClick={() => onSelect(subRegionFor)}
            className="px-4 py-3 bg-white border-2 border-border/50 rounded-2xl text-left hover:border-coral transition-colors"
          >
            <span className="text-sm text-text-sub">全体（すべての島を含む）</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="都道府県を検索..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 bg-cream border-2 border-border rounded-xl text-text placeholder:text-text-sub/50 focus:outline-none focus:border-coral transition-colors"
      />

      {search ? (
        <div className="grid grid-cols-4 gap-2">
          {filtered.map((pref) => (
            <PrefectureThumbnail
              key={pref.code}
              prefecture={pref}
              onClick={() => handlePrefectureClick(pref.code)}
            />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-4 text-center text-text-sub py-8">
              見つかりませんでした
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {regions.map((region) => (
            <div key={region.id}>
              <h3 className="text-sm font-bold text-text-sub mb-2">
                {region.name}
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {region.prefectureCodes
                  .filter((code) => prefectures[code])
                  .map((code) => (
                    <PrefectureThumbnail
                      key={code}
                      prefecture={prefectures[code]}
                      onClick={() => handlePrefectureClick(code)}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
