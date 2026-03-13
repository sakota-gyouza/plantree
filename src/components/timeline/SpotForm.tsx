"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SpotIcon } from "@/types/trip";
import { PrefectureShape } from "@/data/prefectures";
import { searchPlaces, geocodeAddress, rememberUserSpot, GeocodeSuggestion } from "@/lib/utils/geocode";
import { Button } from "@/components/ui/Button";
import { iconMap, colorMap } from "@/components/prefecture/PrefecturePin";
import { MapPin, Search, Loader2, X } from "lucide-react";

export interface SpotFormData {
  name: string;
  icon: SpotIcon;
  notes: string;
  time?: string;
  position?: { x: number; y: number };
  lat?: number;
  lon?: number;
  noPin?: boolean;
}

interface SpotFormProps {
  initialData?: {
    name: string;
    icon: SpotIcon;
    notes?: string;
    time?: string;
    noPin?: boolean;
  };
  prefecture: PrefectureShape;
  prefectureCode: number;
  onSubmit: (data: SpotFormData) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const spotIcons: { value: SpotIcon; label: string }[] = [
  { value: "shrine", label: "神社" },
  { value: "temple", label: "寺院" },
  { value: "food", label: "グルメ" },
  { value: "cafe", label: "カフェ" },
  { value: "shopping", label: "買物" },
  { value: "nature", label: "自然" },
  { value: "museum", label: "施設" },
  { value: "hotel", label: "宿泊" },
  { value: "station", label: "駅" },
  { value: "photo", label: "写真" },
  { value: "transport", label: "移動" },
  { value: "park", label: "公園" },
  { value: "amusement", label: "遊び" },
  { value: "other", label: "他" },
];

export function SpotForm({ initialData, prefecture, prefectureCode, onSubmit, onCancel, onDelete }: SpotFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [icon, setIcon] = useState<SpotIcon>(initialData?.icon ?? "other");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [time, setTime] = useState(initialData?.time ?? "");
  const [noPin, setNoPin] = useState(initialData?.noPin ?? false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedLatLon, setSelectedLatLon] = useState<{ lat: number; lon: number } | null>(null);
  const [manualAddress, setManualAddress] = useState(false);
  const [address, setAddress] = useState("");
  const [resolving, setResolving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const isEditing = !!initialData;

  // Debounced search
  const doSearch = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!query.trim() || query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        setSearching(true);
        const results = await searchPlaces(query, prefecture, prefectureCode);
        setSuggestions(results);
        setShowSuggestions(true);
        setSearching(false);
      }, 400);
    },
    [prefecture, prefectureCode]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    setSelectedPosition(null);
    setSelectedLatLon(null);
    setManualAddress(false);
    if (!isEditing) {
      doSearch(value);
    }
  };

  const handleSelectSuggestion = (suggestion: GeocodeSuggestion) => {
    setName(suggestion.name);
    setSelectedPosition(suggestion.position);
    setSelectedLatLon({ lat: suggestion.lat, lon: suggestion.lon });
    setShowSuggestions(false);
    setManualAddress(false);
  };

  const handleManualAddressSelect = () => {
    setShowSuggestions(false);
    setManualAddress(true);
    setSelectedPosition(null);
  };

  const handleResolveAddress = async () => {
    if (!address.trim()) return;
    setResolving(true);
    const result = await geocodeAddress(address, prefecture);
    setResolving(false);
    if (result) {
      setSelectedPosition({ x: result.x, y: result.y });
      setSelectedLatLon({ lat: result.lat, lon: result.lon });
      setManualAddress(false);
      // Remember this spot for future searches
      if (name.trim()) {
        rememberUserSpot(name.trim(), address.trim(), result.lat, result.lon, prefectureCode);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    // For new spots without noPin, require a position
    if (!isEditing && !noPin && !selectedPosition) return;
    onSubmit({
      name: name.trim(),
      icon,
      notes: notes.trim(),
      time: time || undefined,
      position: noPin ? undefined : (selectedPosition || undefined),
      lat: selectedLatLon?.lat,
      lon: selectedLatLon?.lon,
      noPin,
    });
  };

  const canSubmit = isEditing
    ? !!name.trim()
    : !!name.trim() && (!!selectedPosition || noPin);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* Name with autocomplete */}
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="スポット名を検索"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0 && !selectedPosition) setShowSuggestions(true);
            }}
            autoFocus={!isEditing}
            className="w-full px-3 py-3 pr-8 bg-cream border-2 border-border rounded-xl text-base text-text placeholder:text-text-sub/50 focus:outline-none focus:border-coral transition-colors"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub/40">
            {searching ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
          </div>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <div
            ref={suggestionsRef}
            className="absolute left-0 right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto"
          >
            {suggestions.length > 0 ? (
              <>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full text-left px-3 py-3 hover:bg-cream active:bg-peach/30 transition-colors border-b border-border/30 last:border-b-0"
                  >
                    <div className="text-sm font-bold text-text truncate flex items-center gap-1.5">
                      {s.name}
                      {s.isUserSpot && (
                        <span className="text-[9px] bg-peach/50 text-coral px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                          保存済み
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-text-sub truncate mt-0.5">
                      {s.address}
                    </div>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleManualAddressSelect}
                  className="w-full text-left px-3 py-3 hover:bg-cream active:bg-peach/30 transition-colors flex items-center gap-1.5 text-coral border-t border-border/30"
                >
                  <MapPin size={14} />
                  <span className="text-sm font-bold">住所を直接入力する</span>
                </button>
              </>
            ) : !searching ? (
              <div className="px-3 py-3">
                <div className="text-sm text-text-sub mb-2">
                  候補が見つかりません
                </div>
                <button
                  type="button"
                  onClick={handleManualAddressSelect}
                  className="w-full text-left py-1 flex items-center gap-1.5 text-coral"
                >
                  <MapPin size={14} />
                  <span className="text-sm font-bold">住所を直接入力する</span>
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Selected position indicator */}
      {selectedPosition && !isEditing && (
        <div className="flex items-center gap-1.5 px-1">
          <MapPin size={12} className="text-green-500" />
          <span className="text-xs text-green-600 font-bold">位置が確定しました</span>
        </div>
      )}

      {/* Manual address input */}
      {manualAddress && (
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <MapPin size={12} className="text-coral" />
            <span className="text-xs text-coral font-bold">
              住所を入力してください
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="例: 沖縄県国頭郡本部町字石川424"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="flex-1 px-3 py-3 bg-cream border-2 border-coral/40 rounded-xl text-base text-text placeholder:text-text-sub/50 focus:outline-none focus:border-coral transition-colors"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleResolveAddress();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleResolveAddress}
              disabled={!address.trim() || resolving}
            >
              {resolving ? <Loader2 size={14} className="animate-spin" /> : "検索"}
            </Button>
          </div>
        </div>
      )}

      {/* Time input */}
      <div>
        <label className="text-xs text-text-sub font-bold mb-1 block">時刻（任意）</label>
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-32 px-3 py-2 bg-cream border-2 border-border rounded-xl text-sm text-text focus:outline-none focus:border-coral transition-colors"
          />
          {time && (
            <button
              type="button"
              onClick={() => setTime("")}
              className="p-1.5 text-text-sub/40 hover:text-red-400 transition-colors"
              title="時刻をクリア"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Icon picker - horizontal slider */}
      <div>
        <label className="text-xs text-text-sub font-bold mb-1 block">カテゴリ</label>
        <div className="relative -mx-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1 px-4 scrollbar-hide">
            {spotIcons.map(({ value, label }) => {
              const Icon = iconMap[value];
              const color = colorMap[value];
              const isSelected = icon === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setIcon(value)}
                  className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg transition-all flex-shrink-0 ${
                    isSelected
                      ? "bg-cream border border-coral"
                      : "border border-transparent hover:bg-cream"
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: isSelected ? color : "#f0f0f0" }}
                  >
                    <Icon size={12} />
                  </div>
                  <span className="text-[9px] font-bold text-text-sub leading-none">
                    {label}
                  </span>
                </button>
              );
            })}
            {/* Spacer so last item isn't flush with edge */}
            <div className="flex-shrink-0 w-2" />
          </div>
          {/* Fade hints on both edges */}
          <div className="absolute left-0 top-0 bottom-1 w-5 bg-gradient-to-r from-white to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-1 w-5 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Notes */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="メモ（任意）"
        rows={2}
        className="w-full px-3 py-2.5 bg-cream border-2 border-border rounded-xl text-sm text-text placeholder:text-text-sub/50 focus:outline-none focus:border-coral transition-colors resize-none"
      />

      {/* No pin checkbox */}
      {!isEditing && (
        <label className="flex items-center gap-2 px-1 cursor-pointer">
          <input
            type="checkbox"
            checked={noPin}
            onChange={(e) => setNoPin(e.target.checked)}
            className="w-4 h-4 rounded border-border text-coral focus:ring-coral accent-coral"
          />
          <span className="text-xs text-text-sub">地図にピンを刺さない</span>
        </label>
      )}

      {/* Actions */}
      <div className="flex gap-2 items-center">
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-red-400 hover:text-red-500 transition-colors mr-auto"
          >
            削除
          </button>
        )}
        <div className={`flex gap-2 ${onDelete ? "" : "w-full"}`}>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            キャンセル
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!canSubmit}
          >
            {isEditing ? "更新" : "追加"}
          </Button>
        </div>
      </div>
    </form>
  );
}
