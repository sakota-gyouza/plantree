"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Trip } from "@/types/trip";
import { getPrefecture } from "@/data/prefectures";
import { MapPin, Trash2, Camera } from "lucide-react";

interface TripCardProps {
  trip: Trip;
  onClick: () => void;
  onDelete: () => void;
  onUploadImage?: (file: File) => Promise<void>;
}

const pastelColors = [
  "#FF9A8B", "#A8D8EA", "#FFD3B6", "#B5EAD7", "#B19CD9",
];

export function TripCard({ trip, onClick, onDelete, onUploadImage }: TripCardProps) {
  const pref = getPrefecture(trip.prefectureCode, trip.subRegion);
  const fillColor = pastelColors[(trip.prefectureCode - 1) % pastelColors.length];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadImage) return;
    setUploading(true);
    try {
      await onUploadImage(file);
    } catch (err) {
      console.error("Cover upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
        className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-red-50 text-text-sub hover:text-red-400 transition-all"
      >
        <Trash2 size={16} />
      </button>

      <div className="flex items-center gap-4">
        <div
          className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden relative group/img"
          onClick={onUploadImage ? handleImageClick : undefined}
        >
          {trip.coverImageUrl ? (
            <img
              src={trip.coverImageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : pref ? (
            <div className="w-full h-full flex items-center justify-center">
              <svg viewBox={pref.viewBox} className="w-full h-full">
                <path
                  d={pref.path}
                  fill={fillColor}
                  stroke="white"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {pref.extraPaths?.map((ep, i) => (
                  <path
                    key={i}
                    d={ep.d}
                    fill={ep.fill || fillColor}
                    stroke={ep.stroke || "white"}
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>
            </div>
          ) : null}
          {onUploadImage && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity rounded-xl">
              <Camera size={16} className="text-white" />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
              <motion.div
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              />
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
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
