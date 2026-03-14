"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Spot } from "@/types/trip";
import { iconMap, colorMap } from "@/components/prefecture/PrefecturePin";
import {
  haversineDistance,
  formatDistance,
  estimateTime,
  defaultMode,
  TravelMode,
} from "@/lib/utils/distance";

const modeIcons: Record<TravelMode, string> = {
  walk: "🚶",
  car: "🚗",
  train: "🚃",
};

const modeOrder: TravelMode[] = ["walk", "car"];

interface TimelineItemProps {
  spot: Spot;
  nextSpot?: Spot;
  showDistance?: boolean;
  index: number;
  isOpen: boolean;
  isLast: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TimelineItem({
  spot,
  nextSpot,
  showDistance,
  index,
  isOpen,
  isLast,
  onToggle,
  onEdit,
  onDelete,
}: TimelineItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: spot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = iconMap[spot.icon] || iconMap.other;
  const color = colorMap[spot.icon] || colorMap.other;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? "opacity-50 z-50" : ""}`}
    >
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-2 border-peach/60">
        {/* Top row: drag | icon+name+time | edit, delete */}
        <div className="flex items-center gap-1 pr-1.5">
          <div
            className="p-2.5 text-text-sub/30 hover:text-text-sub cursor-grab active:cursor-grabbing touch-none transition-colors"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={15} />
          </div>

          <div className="flex-1 flex items-center gap-2.5 py-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-sm text-text truncate">{spot.name}</h4>
                {spot.time && (
                  <span className="text-[10px] text-text-sub font-bold flex-shrink-0">
                    {spot.time}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 text-text-sub/30 hover:text-coral transition-colors rounded-lg"
            title="編集"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-text-sub/30 hover:text-red-400 transition-colors rounded-lg"
            title="削除"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Memo row: always visible, with dropdown for full text */}
        {spot.notes && (
          <div className="px-3 pb-2.5 -mt-1 border-t border-border/30 pt-2">
            <div className="flex items-start gap-1">
              <p
                className={`flex-1 text-xs text-text-sub leading-relaxed ${
                  isOpen
                    ? "whitespace-pre-wrap break-words"
                    : "line-clamp-3"
                }`}
              >
                {spot.notes}
              </p>
              <button
                onClick={onToggle}
                className="p-0.5 text-text-sub/30 hover:text-text transition-colors rounded flex-shrink-0 mt-0.5"
              >
                <ChevronDown
                  size={12}
                  className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Connector with distance */}
      {!isLast && (
        showDistance
          ? <DistanceConnector spot={spot} nextSpot={nextSpot} />
          : <div className="flex justify-center py-0.5"><div className="w-0.5 h-4 bg-peach/50 rounded-full" /></div>
      )}
    </div>
  );
}

function DistanceConnector({ spot, nextSpot }: { spot: Spot; nextSpot?: Spot }) {
  const [mode, setMode] = useState<TravelMode | null>(null);

  const hasCoords =
    spot.lat != null &&
    spot.lon != null &&
    nextSpot?.lat != null &&
    nextSpot?.lon != null;

  if (!hasCoords) {
    return (
      <div className="flex justify-center py-0.5">
        <div className="w-0.5 h-4 bg-peach/50 rounded-full" />
      </div>
    );
  }

  const dist = haversineDistance(spot.lat!, spot.lon!, nextSpot!.lat!, nextSpot!.lon!);
  const active = mode ?? defaultMode(dist);
  const timeStr = estimateTime(dist, active);
  const distStr = formatDistance(dist);

  return (
    <div className="flex items-center justify-center py-1.5 gap-2">
      <div className="w-0.5 h-2 bg-peach/50 rounded-full" />
      <div className="flex items-center gap-0.5 bg-cream/80 rounded-full p-0.5">
        {modeOrder.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
              active === m
                ? "bg-white shadow-sm scale-110"
                : "opacity-40 hover:opacity-70"
            }`}
          >
            {modeIcons[m]}
          </button>
        ))}
      </div>
      <span className="text-[10px] text-text-sub font-bold">
        {timeStr}
      </span>
      <span className="text-[10px] text-text-sub/50">
        {distStr}
      </span>
      <div className="w-0.5 h-2 bg-peach/50 rounded-full" />
    </div>
  );
}
