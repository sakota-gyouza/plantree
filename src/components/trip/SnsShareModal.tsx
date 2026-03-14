"use client";

import { useState, useCallback } from "react";
import { Share2, Link, Check, Globe, GlobeLock } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { getStorage } from "@/lib/storage";
import { Trip } from "@/types/trip";
import { Modal } from "@/components/ui/Modal";

interface SnsShareModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function SnsShareModal({ trip, isOpen, onClose, onUpdate }: SnsShareModalProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [toggling, setToggling] = useState(false);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/share/${trip.id}`
    : `/share/${trip.id}`;

  const handleTogglePublic = useCallback(async () => {
    if (!user) return;
    setToggling(true);
    try {
      const storage = getStorage(createClient());
      await storage.updateTrip(trip.id, { isPublic: !trip.isPublic });
      onUpdate();
    } finally {
      setToggling(false);
    }
  }, [user, trip.id, trip.isPublic, onUpdate]);

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: trip.name,
          text: `${trip.name} - Plantreeの旅行プラン`,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    }
  }, [trip.name, shareUrl]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SNSでシェア" compact>
      <div className="flex flex-col gap-4">
        {/* Public toggle */}
        <div className="flex items-center gap-3 px-3 py-3 bg-cream rounded-xl">
          {trip.isPublic ? (
            <Globe size={18} className="text-mint flex-shrink-0" />
          ) : (
            <GlobeLock size={18} className="text-text-sub flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text">
              {trip.isPublic ? "公開中" : "非公開"}
            </p>
            <p className="text-[10px] text-text-sub">
              {trip.isPublic
                ? "リンクを知っている人は閲覧できます"
                : "公開するとリンクでシェアできます"}
            </p>
          </div>
          <button
            onClick={handleTogglePublic}
            disabled={toggling}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              trip.isPublic ? "bg-coral" : "bg-border"
            }`}
          >
            <div
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
                trip.isPublic ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Share actions (only when public) */}
        {trip.isPublic && (
          <>
            {/* Copy link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-3 px-3 py-3 bg-white rounded-xl border border-border hover:border-coral transition-colors"
            >
              {copied ? (
                <Check size={18} className="text-mint" />
              ) : (
                <Link size={18} className="text-text-sub" />
              )}
              <span className="text-sm font-bold text-text">
                {copied ? "コピーしました!" : "リンクをコピー"}
              </span>
            </button>

            {/* Native share (mobile) */}
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                onClick={handleNativeShare}
                className="flex items-center gap-3 px-3 py-3 bg-coral text-white rounded-xl hover:bg-coral-dark transition-colors"
              >
                <Share2 size={18} />
                <span className="text-sm font-bold">
                  LINE / X / その他で共有
                </span>
              </button>
            )}

            {/* Preview URL */}
            <div className="px-3 py-2 bg-cream/60 rounded-lg">
              <p className="text-[10px] text-text-sub break-all">{shareUrl}</p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
