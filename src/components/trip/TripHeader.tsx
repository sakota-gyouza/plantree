"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Edit3, UserPlus, Share2 } from "lucide-react";
import { Trip } from "@/types/trip";
import { prefectures } from "@/data/prefectures";
import { useAuth } from "@/components/auth/AuthProvider";
import { OnlineUsers } from "./OnlineUsers";
import type { OnlineUser } from "@/lib/hooks/useRealtimeTrip";

interface TripHeaderProps {
  trip: Trip;
  onEditName: () => void;
  onShare?: () => void;
  onSnsShare?: () => void;
  onlineUsers?: OnlineUser[];
}

export function TripHeader({ trip, onEditName, onShare, onSnsShare, onlineUsers = [] }: TripHeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const pref = prefectures[trip.prefectureCode];

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm sticky top-0 z-20 border-b border-border">
      <button
        onClick={() => router.push("/")}
        className="p-2 -ml-2 rounded-full hover:bg-cream transition-colors text-text-sub hover:text-text"
      >
        <ArrowLeft size={20} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-text truncate">{trip.name}</h1>
          <button
            onClick={onEditName}
            className="text-text-sub hover:text-coral transition-colors flex-shrink-0"
          >
            <Edit3 size={14} />
          </button>
        </div>
        {pref && (
          <span className="text-xs text-text-sub">{pref.name}</span>
        )}
      </div>
      <OnlineUsers users={onlineUsers} />
      {user && onSnsShare && (
        <button
          onClick={onSnsShare}
          className="p-2 rounded-full hover:bg-cream transition-colors text-text-sub hover:text-coral"
          title="SNSシェア"
        >
          <Share2 size={18} />
        </button>
      )}
      {user && onShare && (
        <button
          onClick={onShare}
          className="p-2 rounded-full hover:bg-cream transition-colors text-text-sub hover:text-coral"
          title="フレンド招待"
        >
          <UserPlus size={18} />
        </button>
      )}
    </div>
  );
}
