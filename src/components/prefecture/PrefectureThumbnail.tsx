"use client";

import { motion } from "framer-motion";
import { PrefectureShape } from "@/data/prefectures";

interface PrefectureThumbnailProps {
  prefecture: PrefectureShape;
  onClick: () => void;
  selected?: boolean;
}

const pastelColors = [
  "#FF9A8B", "#A8D8EA", "#FFD3B6", "#B5EAD7", "#B19CD9",
  "#FFB347", "#77DD77", "#FF6B6B", "#C9A96E", "#7EC8E3",
];

export function PrefectureThumbnail({
  prefecture,
  onClick,
  selected,
}: PrefectureThumbnailProps) {
  const fillColor = pastelColors[(prefecture.code - 1) % pastelColors.length];
  const useFocus = !!prefecture.focus;
  const viewBox = useFocus
    ? `${prefecture.focus!.x} ${prefecture.focus!.y} ${prefecture.focus!.width} ${prefecture.focus!.height}`
    : prefecture.viewBox;
  const sw = useFocus ? 1 : 3;

  return (
    <motion.button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors ${
        selected
          ? "bg-coral/20 border-2 border-coral"
          : "bg-white border-2 border-transparent hover:border-peach hover:shadow-md"
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <svg viewBox={viewBox} className="w-16 h-16">
        <path
          d={prefecture.path}
          fill={fillColor}
          stroke="white"
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-xs font-bold text-text truncate w-full text-center">
        {prefecture.name}
      </span>
    </motion.button>
  );
}
