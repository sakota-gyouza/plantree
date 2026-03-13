"use client";

import { motion } from "framer-motion";
import { Spot, SpotIcon } from "@/types/trip";
import {
  Star,
  UtensilsCrossed,
  Coffee,
  ShoppingBag,
  TreePine,
  Building2,
  Hotel,
  TrainFront,
  Camera,
  MapPin,
  Landmark,
  Bus,
  Trees,
  FerrisWheel,
} from "lucide-react";

const iconMap: Record<SpotIcon, React.ComponentType<{ size?: number }>> = {
  shrine: Star,
  temple: Landmark,
  food: UtensilsCrossed,
  cafe: Coffee,
  shopping: ShoppingBag,
  nature: TreePine,
  museum: Building2,
  hotel: Hotel,
  station: TrainFront,
  photo: Camera,
  transport: Bus,
  park: Trees,
  amusement: FerrisWheel,
  other: MapPin,
};

const colorMap: Record<SpotIcon, string> = {
  shrine: "#FF6B6B",
  temple: "#C9A96E",
  food: "#FFB347",
  cafe: "#A0826D",
  shopping: "#B19CD9",
  nature: "#77DD77",
  museum: "#7EC8E3",
  hotel: "#FF9A8B",
  station: "#9B9B9B",
  photo: "#FFD700",
  transport: "#6BAACC",
  park: "#4CAF50",
  amusement: "#FF69B4",
  other: "#A8D8EA",
};

interface PrefecturePinProps {
  spot: Spot;
  index: number;
  viewBox: string;
  isSelected?: boolean;
  mapScale?: number;
  onClick?: (e: React.MouseEvent) => void;
}

export function PrefecturePin({ spot, index, viewBox, isSelected, mapScale = 1, onClick }: PrefecturePinProps) {
  const [, , vbWidth, vbHeight] = viewBox.split(" ").map(Number);
  const leftPercent = (spot.position.x / vbWidth) * 100;
  const topPercent = (spot.position.y / vbHeight) * 100;
  const Icon = iconMap[spot.icon] || MapPin;
  const color = colorMap[spot.icon] || "#A8D8EA";

  const inverseScale = 1 / mapScale;

  return (
    <motion.button
      className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto ${
        isSelected ? "z-30" : "z-10"
      }`}
      style={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        transform: `translate(-50%, -50%) scale(${inverseScale})`,
      }}
      initial={{ scale: 0, y: -20 }}
      animate={{ scale: inverseScale, y: 0 }}
      transition={{ type: "spring", damping: 12, stiffness: 200, delay: index * 0.08 }}
      onClick={onClick}
    >
      <div
        className={`rounded-full flex items-center justify-center border-2 border-white transition-all duration-200 ${
          isSelected ? "w-8 h-8 shadow-lg" : "w-6 h-6 shadow-md"
        }`}
        style={{ backgroundColor: color }}
      >
        <Icon size={isSelected ? 14 : 10} />
      </div>
      {isSelected && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-text shadow-sm border border-border/30">
          {spot.name}
        </div>
      )}
    </motion.button>
  );
}

export { iconMap, colorMap };
