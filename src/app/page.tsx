"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TreePine, List, LogOut, Users } from "lucide-react";
import { useTrips } from "@/lib/hooks/useTrips";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoginButton } from "@/components/auth/LoginButton";
import { Modal } from "@/components/ui/Modal";
import { PrefectureSelector } from "@/components/prefecture/PrefectureSelector";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function Home() {
  const router = useRouter();
  const { createTrip } = useTrips();
  const { user, loading: authLoading, signOut } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPrefecture, setSelectedPrefecture] = useState<number | null>(null);
  const [selectedSubRegion, setSelectedSubRegion] = useState<string | undefined>(undefined);
  const [tripName, setTripName] = useState("");

  const handleSelectPrefecture = (code: number, subRegion?: string) => {
    setSelectedPrefecture(code);
    setSelectedSubRegion(subRegion);
  };

  const handleCreate = async () => {
    if (!selectedPrefecture || !tripName.trim()) return;
    const trip = await createTrip({
      name: tripName.trim(),
      prefectureCode: selectedPrefecture,
      subRegion: selectedSubRegion,
      days: 1,
      spots: [],
    });
    setShowCreate(false);
    setSelectedPrefecture(null);
    setSelectedSubRegion(undefined);
    setTripName("");
    router.push(`/trip/${trip.id}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative">
      {/* User menu */}
      {!authLoading && user && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={() => router.push("/friends")}
            className="w-9 h-9 rounded-full bg-cream flex items-center justify-center text-text-sub hover:text-coral transition-colors"
          >
            <Users size={16} />
          </button>
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt=""
              className="w-9 h-9 rounded-full border-2 border-border"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-coral text-white flex items-center justify-center text-sm font-bold">
              {(user.user_metadata?.full_name || user.email || "?")[0]}
            </div>
          )}
          <button
            onClick={signOut}
            className="w-9 h-9 rounded-full bg-cream flex items-center justify-center text-text-sub hover:text-coral transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}

      {/* Hero illustration */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="text-7xl mb-4"
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          🌳
        </motion.div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <TreePine className="text-coral" size={28} />
          <h1 className="text-3xl font-bold text-text">Plantree</h1>
        </div>
        <p className="text-text-sub text-sm">旅のプランを可愛く作ろう</p>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        className="flex flex-col gap-3 w-full max-w-xs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Button
          onClick={() => setShowCreate(true)}
          className="w-full py-3 text-base"
        >
          プランを作る
        </Button>
        <button
          onClick={() => router.push("/plans")}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-border text-text-sub font-bold hover:border-coral hover:text-coral transition-colors"
        >
          <List size={16} />
          プラン一覧を見る
        </button>
        {!authLoading && !user && (
          <div className="mt-2">
            <LoginButton />
          </div>
        )}
      </motion.div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          setSelectedPrefecture(null);
          setSelectedSubRegion(undefined);
          setTripName("");
        }}
        title="新しいプランを作成"
      >
        {!selectedPrefecture ? (
          <div>
            <p className="text-sm text-text-sub mb-4">
              まず行き先の都道府県を選びましょう
            </p>
            <PrefectureSelector onSelect={handleSelectPrefecture} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Input
              label="プラン名"
              placeholder="例: 京都春の旅"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedPrefecture(null);
                  setSelectedSubRegion(undefined);
                }}
                className="flex-1"
              >
                戻る
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!tripName.trim()}
                className="flex-1"
              >
                作成する
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
