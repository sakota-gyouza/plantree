"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSpots } from "@/lib/hooks/useSpots";
import { useAuth } from "@/components/auth/AuthProvider";
import { getStorage } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { getPrefecture } from "@/data/prefectures";
import { Spot } from "@/types/trip";
import { PrefectureMap } from "@/components/prefecture/PrefectureMap";
import { TimelineTree } from "@/components/timeline/TimelineTree";
import { SpotForm, SpotFormData } from "@/components/timeline/SpotForm";
import { TripHeader } from "@/components/trip/TripHeader";
import { ShareModal } from "@/components/trip/ShareModal";
import { OnlineUsers } from "@/components/trip/OnlineUsers";
import { Modal } from "@/components/ui/Modal";

export default function TripPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { user } = useAuth();
  const { trip, spots, loading, addSpot, updateSpot, deleteSpot, reorderSpots, refresh, onlineUsers } =
    useSpots(tripId);

  const [showSpotForm, setShowSpotForm] = useState(false);
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null);
  const [pendingDay, setPendingDay] = useState(1);
  const [activeDay, setActiveDay] = useState(1);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [showShare, setShowShare] = useState(false);

  const getStorageAdapter = useCallback(() => {
    if (user) return getStorage(createClient());
    return getStorage();
  }, [user]);

  if (loading || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-sub">
        読み込み中...
      </div>
    );
  }

  const prefecture = getPrefecture(trip.prefectureCode, trip.subRegion);
  const days = trip.days || 1;

  if (!prefecture) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-sub">
        都道府県データが見つかりません
      </div>
    );
  }

  const handleSpotClick = (spot: Spot) => {
    setEditingSpot(spot);
    setShowSpotForm(true);
  };

  const handleAddClick = (day: number) => {
    setPendingDay(day);
    setEditingSpot(null);
    setShowSpotForm(true);
  };

  const handleAddDay = async () => {
    await getStorageAdapter().updateTrip(tripId, { days: days + 1 });
    await refresh();
  };

  const handleRemoveDay = async (day: number) => {
    if (days <= 1) return;
    const updatedSpots = spots
      .filter((s) => s.day !== day)
      .map((s) => (s.day > day ? { ...s, day: s.day - 1 } : s));
    const currentInfos = trip.dayInfos || [];
    const updatedInfos = [
      ...currentInfos.slice(0, day - 1),
      ...currentInfos.slice(day),
    ];
    await getStorageAdapter().updateTrip(tripId, {
      days: days - 1,
      spots: updatedSpots,
      dayInfos: updatedInfos,
    });
    await refresh();
  };

  const handleUpdateDayLabel = async (day: number, label: string | undefined) => {
    const currentInfos = [...(trip.dayInfos || [])];
    while (currentInfos.length < day) {
      currentInfos.push({});
    }
    currentInfos[day - 1] = { label };
    await getStorageAdapter().updateTrip(tripId, { dayInfos: currentInfos });
    await refresh();
  };

  const handleSubmitSpot = async (data: SpotFormData) => {
    const fallbackPosition = () => {
      const [, , vbW, vbH] = prefecture.viewBox.split(" ").map(Number);
      return { x: Math.round(vbW / 2), y: Math.round(vbH / 2) };
    };

    if (editingSpot) {
      await updateSpot(editingSpot.id, {
        name: data.name,
        icon: data.icon,
        notes: data.notes,
        time: data.time,
        position: data.position || editingSpot.position,
        lat: data.lat ?? editingSpot.lat,
        lon: data.lon ?? editingSpot.lon,
        noPin: data.noPin,
      });
    } else {
      await addSpot({
        name: data.name,
        icon: data.icon,
        notes: data.notes,
        time: data.time,
        position: data.noPin ? fallbackPosition() : (data.position || fallbackPosition()),
        lat: data.lat,
        lon: data.lon,
        order: spots.length,
        day: pendingDay,
        noPin: data.noPin,
      });
    }
    setShowSpotForm(false);
    setEditingSpot(null);
  };

  const handleDeleteSpot = async () => {
    if (editingSpot) {
      await deleteSpot(editingSpot.id);
      setShowSpotForm(false);
      setEditingSpot(null);
    }
  };

  const handleDeleteSpotDirect = async (spotId: string) => {
    await deleteSpot(spotId);
  };

  const handleEditName = () => {
    setNewName(trip.name);
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (newName.trim()) {
      await getStorageAdapter().updateTrip(tripId, { name: newName.trim() });
      await refresh();
    }
    setEditingName(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TripHeader
        trip={trip}
        onEditName={handleEditName}
        onShare={() => setShowShare(true)}
        onlineUsers={onlineUsers}
      />

      <div className="flex-1 flex flex-col">
        {/* Map Section */}
        <div className="px-2 pt-2 pb-1 flex items-center justify-center bg-cream/50">
          <PrefectureMap
            prefecture={prefecture}
            spots={spots}
            onSpotClick={handleSpotClick}
          />
        </div>

        {/* Timeline Section */}
        <div className="border-t border-border bg-white/50 px-4 py-3 flex-1">
          <h2 className="text-sm font-bold text-text-sub mb-2 px-1">
            タイムライン
          </h2>
          <TimelineTree
            spots={spots}
            days={days}
            dayInfos={trip.dayInfos}
            activeDay={activeDay}
            onActiveDayChange={setActiveDay}
            onReorder={reorderSpots}
            onEditSpot={handleSpotClick}
            onDeleteSpot={handleDeleteSpotDirect}
            onAddClick={handleAddClick}
            onAddDay={handleAddDay}
            onRemoveDay={handleRemoveDay}
            onUpdateDayLabel={handleUpdateDayLabel}
          />
        </div>
      </div>

      {/* Spot Form Modal */}
      <Modal
        isOpen={showSpotForm}
        onClose={() => {
          setShowSpotForm(false);
          setEditingSpot(null);
        }}
        title={editingSpot ? "スポットを編集" : "スポットを追加"}
        compact
      >
        <SpotForm
          key={editingSpot?.id ?? "new"}
          initialData={
            editingSpot
              ? {
                  name: editingSpot.name,
                  icon: editingSpot.icon,
                  notes: editingSpot.notes,
                  time: editingSpot.time,
                  noPin: editingSpot.noPin,
                }
              : undefined
          }
          prefecture={prefecture}
          prefectureCode={trip.prefectureCode}
          onSubmit={handleSubmitSpot}
          onCancel={() => {
            setShowSpotForm(false);
            setEditingSpot(null);
          }}
          onDelete={editingSpot ? handleDeleteSpot : undefined}
        />
      </Modal>

      {/* Edit Name Modal */}
      <Modal
        isOpen={editingName}
        onClose={() => setEditingName(false)}
        title="プラン名を変更"
        compact
      >
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-4 py-2.5 bg-cream border-2 border-border rounded-xl text-text focus:outline-none focus:border-coral transition-colors"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveName();
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setEditingName(false)}
              className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-border text-text-sub font-bold hover:border-coral transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSaveName}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-coral text-white font-bold hover:bg-coral-dark transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </Modal>

      {/* Share Modal */}
      <ShareModal
        tripId={tripId}
        isOpen={showShare}
        onClose={() => setShowShare(false)}
      />
    </div>
  );
}
