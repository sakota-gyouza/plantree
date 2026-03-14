"use client";

import { OnlineUser } from "@/lib/hooks/useRealtimeTrip";

interface OnlineUsersProps {
  users: OnlineUser[];
}

export function OnlineUsers({ users }: OnlineUsersProps) {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {users.slice(0, 3).map((u) => (
        <div key={u.userId} className="relative" title={u.displayName}>
          {u.avatarUrl ? (
            <img
              src={u.avatarUrl}
              alt=""
              className="w-7 h-7 rounded-full border-2 border-white shadow-sm object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-sky text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm">
              {(u.displayName || "?")[0]}
            </div>
          )}
          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
        </div>
      ))}
      {users.length > 3 && (
        <div className="w-7 h-7 rounded-full bg-cream text-text-sub flex items-center justify-center text-xs font-bold border-2 border-white">
          +{users.length - 3}
        </div>
      )}
    </div>
  );
}
