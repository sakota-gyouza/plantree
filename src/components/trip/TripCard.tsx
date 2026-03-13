"use client";

import { motion } from "framer-motion";
import { Trip } from "@/types/trip";
import { prefectures } from "@/data/prefectures";
import { MapPin, Trash2 } from "lucide-react";

interface TripCardProps {
  trip: Trip;
  onClick: () => void;
  onDelete: () => void;
}

const pastelColors = [
  "#FF9A8B", "#A8D8EA", "#FFD3B6", "#B5EAD7", "#B19CD9",
];

export function TripCard({ trip, onClick, onDelete }: TripCardProps) {
  const pref = prefectures[trip.prefectureCode];
  const fillColor = pastelColors[(trip.prefectureCode - 1) % pastelColors.length];

  return (
    <motion.div
      className="bg-white rounded-3xl p-5 shadow-md hover:shadow-lg transition-shadow cursor-pointer relative group"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      layout
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-3 right-3 p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-50 text-text-sub hover:text-red-400 transition-all"
      >
        <Trash2 size={16} />
      </button>

      <div className="flex items-center gap-4">
        {pref && (
          <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center">
            <svg viewBox={pref.viewBox} className="w-full h-full">
              <path
                d={pref.path}
                fill={fillColor}
                stroke="white"
                strokeWidth="3"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-text truncate">{trip.name}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            {pref && (
              <span className="text-xs text-text-sub">{pref.name}</span>
            )}
            <span className="text-xs text-text-sub flex items-center gap-0.5">
              <MapPin size={10} />
              {trip.spots.length}
            </span>
          </div>
          {trip.date && (
            <span className="text-xs text-text-sub">{trip.date}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
