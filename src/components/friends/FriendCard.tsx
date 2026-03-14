"use client";

import { Profile } from "@/types/friend";

interface ActionConfig {
  label: string;
  variant: "primary" | "danger" | "disabled";
  onClick: () => void;
}

interface FriendCardProps {
  profile: Profile;
  action: ActionConfig;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function FriendCard({
  profile,
  action,
  secondaryAction,
}: FriendCardProps) {
  const variantStyles = {
    primary:
      "bg-coral text-white hover:bg-coral-dark active:scale-95",
    danger:
      "bg-white text-red-400 border border-red-200 hover:bg-red-50 active:scale-95",
    disabled: "bg-cream text-text-sub cursor-not-allowed",
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-cream rounded-2xl">
      {/* Avatar */}
      {profile.avatarUrl ? (
        <img
          src={profile.avatarUrl}
          alt=""
          className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-coral text-white flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm">
          {(profile.displayName || profile.email || "?")[0]}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text truncate">
          {profile.displayName || "名前なし"}
        </p>
        {profile.email && (
          <p className="text-xs text-text-sub truncate">{profile.email}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white text-text-sub border border-border hover:bg-cream active:scale-95 transition-all"
          >
            {secondaryAction.label}
          </button>
        )}
        <button
          onClick={action.onClick}
          disabled={action.variant === "disabled"}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${variantStyles[action.variant]}`}
        >
          {action.label}
        </button>
      </div>
    </div>
  );
}
