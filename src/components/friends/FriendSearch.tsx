"use client";

import { useState, useCallback } from "react";
import { Search } from "lucide-react";
import { Profile } from "@/types/friend";
import { FriendCard } from "./FriendCard";

interface FriendSearchProps {
  onSearch: (query: string) => Promise<Profile[]>;
  onSendRequest: (userId: string) => Promise<void>;
  existingFriendIds: string[];
  sentRequestIds: string[];
}

export function FriendSearch({
  onSearch,
  onSendRequest,
  existingFriendIds,
  sentRequestIds,
}: FriendSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [justSentIds, setJustSentIds] = useState<string[]>([]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    const data = await onSearch(query.trim());
    setResults(data);
    setSearching(false);
    setSearched(true);
  }, [query, onSearch]);

  const getAction = (profile: Profile) => {
    if (existingFriendIds.includes(profile.id)) {
      return {
        label: "フレンド済",
        variant: "disabled" as const,
        onClick: () => {},
      };
    }
    if (sentRequestIds.includes(profile.id) || justSentIds.includes(profile.id)) {
      return {
        label: "申請完了",
        variant: "disabled" as const,
        onClick: () => {},
      };
    }
    return {
      label: "申請",
      variant: "primary" as const,
      onClick: async () => {
        await onSendRequest(profile.id);
        setJustSentIds((prev) => [...prev, profile.id]);
      },
    };
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="フレンドIDで検索"
            className="w-full pl-9 pr-4 py-2.5 bg-cream border-2 border-border rounded-xl text-sm text-text placeholder:text-text-sub/50 focus:outline-none focus:border-coral transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className="px-4 py-2.5 bg-coral text-white text-sm font-bold rounded-xl hover:bg-coral-dark active:scale-95 transition-all disabled:opacity-50"
        >
          検索
        </button>
      </div>

      {searching && (
        <p className="text-center text-text-sub text-sm py-4">検索中...</p>
      )}

      {!searching && searched && results.length === 0 && (
        <p className="text-center text-text-sub text-sm py-8">
          ユーザーが見つかりませんでした
        </p>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((profile) => (
            <FriendCard
              key={profile.id}
              profile={profile}
              action={getAction(profile)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
