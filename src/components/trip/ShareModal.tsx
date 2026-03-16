"use client";

import { useState, useEffect } from "react";
import { UserPlus, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTripMembers } from "@/lib/hooks/useTripMembers";
import { FriendService } from "@/lib/services/friendService";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types/friend";
import { Modal } from "@/components/ui/Modal";
import { Loading } from "@/components/ui/Loading";

interface ShareModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ tripId, isOpen, onClose }: ShareModalProps) {
  const { user } = useAuth();
  const { members, addMember, removeMember } = useTripMembers(tripId);
  const [friendProfiles, setFriendProfiles] = useState<Profile[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  useEffect(() => {
    if (!isOpen || !user) return;
    const service = new FriendService(createClient());
    service.getFriendProfiles().then((profiles) => {
      setFriendProfiles(profiles);
      setLoadingFriends(false);
    });
  }, [isOpen, user]);

  // フレンドの中でまだメンバーでない人
  const memberIds = members.map((m) => m.userId);
  const availableFriends = friendProfiles.filter(
    (f) => !memberIds.includes(f.id)
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="プランを共有" compact>
      <div className="flex flex-col gap-4">
        {/* 現在のメンバー */}
        {members.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-text-sub mb-2">
              共有メンバー
            </h3>
            <div className="flex flex-col gap-1.5">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2.5 px-3 py-2 bg-cream rounded-xl"
                >
                  {member.profile.avatarUrl ? (
                    <img
                      src={member.profile.avatarUrl}
                      alt=""
                      className="w-8 h-8 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-coral text-white flex items-center justify-center text-xs font-bold">
                      {(member.profile.displayName || "?")[0]}
                    </div>
                  )}
                  <span className="flex-1 text-sm font-bold text-text truncate">
                    {member.profile.displayName}
                  </span>
                  <span className="text-xs text-text-sub">
                    {member.role === "editor" ? "編集可" : "閲覧のみ"}
                  </span>
                  <button
                    onClick={() => removeMember(member.userId)}
                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-text-sub hover:text-red-400 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* フレンドを招待 */}
        <div>
          <h3 className="text-xs font-bold text-text-sub mb-2">
            フレンドを招待
          </h3>
          {loadingFriends ? (
            <Loading />
          ) : availableFriends.length === 0 ? (
            <p className="text-center text-text-sub text-sm py-4">
              {friendProfiles.length === 0
                ? "フレンドがいません"
                : "全員招待済みです"}
            </p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
              {availableFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-2.5 px-3 py-2 bg-white rounded-xl border border-border"
                >
                  {friend.avatarUrl ? (
                    <img
                      src={friend.avatarUrl}
                      alt=""
                      className="w-8 h-8 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-sky text-white flex items-center justify-center text-xs font-bold">
                      {(friend.displayName || "?")[0]}
                    </div>
                  )}
                  <span className="flex-1 text-sm text-text truncate">
                    {friend.displayName}
                  </span>
                  <button
                    onClick={() => addMember(friend.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-coral text-white hover:bg-coral-dark active:scale-95 transition-all"
                  >
                    <UserPlus size={12} />
                    招待
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
