"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronLeft } from "lucide-react";
import { useTrips } from "@/lib/hooks/useTrips";
import { createClient } from "@/lib/supabase/client";
import { TripCard } from "@/components/trip/TripCard";
import { Modal } from "@/components/ui/Modal";
import { PrefectureSelector } from "@/components/prefecture/PrefectureSelector";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function PlansPage() {
  const router = useRouter();
  const { trips, loading, createTrip, deleteTrip, updateTrip } = useTrips();
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

  const handleDelete = async (id: string) => {
    if (window.confirm("このプランを削除しますか？")) {
      await deleteTrip(id);
    }
  };

  const handleUploadImage = async (tripId: string, file: File) => {
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "png";
    const filePath = `${tripId}/cover_${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("trip-covers")
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("trip-covers").getPublicUrl(filePath);

    await updateTrip(tripId, { coverImageUrl: `${publicUrl}?t=${Date.now()}` });
  };

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/")}
          className="p-2 -ml-2 rounded-xl text-text-sub hover:text-text hover:bg-cream transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-text">プラン一覧</h1>
      </div>

      {/* Trip List */}
      {loading ? (
        <div className="text-center py-16 text-text-sub">読み込み中...</div>
      ) : trips.length === 0 ? (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-5xl mb-4">🌳</div>
          <p className="text-text-sub mb-1">まだプランがありません</p>
          <p className="text-text-sub text-sm">
            ボタンから最初のプランを作りましょう！
          </p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onClick={() => router.push(`/trip/${trip.id}`)}
                onDelete={() => handleDelete(trip.id)}
                onUploadImage={(file) => handleUploadImage(trip.id, file)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* FAB */}
      <motion.button
        className="fixed bottom-6 right-6 w-14 h-14 bg-coral text-white rounded-full shadow-lg flex items-center justify-center hover:bg-coral-dark active:scale-90 transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowCreate(true)}
      >
        <Plus size={24} />
      </motion.button>

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
