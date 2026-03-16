"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSpots } from "@/lib/hooks/useSpots";
import { useAuth } from "@/components/auth/AuthProvider";
import { getStorage } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { getPrefecture, prefectures } from "@/data/prefectures";
import { Spot, Trip } from "@/types/trip";
import { PrefectureSelector } from "@/components/prefecture/PrefectureSelector";
import { PrefectureMap } from "@/components/prefecture/PrefectureMap";
import { TimelineTree } from "@/components/timeline/TimelineTree";
import { SpotForm, SpotFormData } from "@/components/timeline/SpotForm";
import { PackingList } from "@/components/packing/PackingList";
import { TripHeader } from "@/components/trip/TripHeader";
import { ShareModal } from "@/components/trip/ShareModal";
import { SnsShareModal } from "@/components/trip/SnsShareModal";
import { OnlineUsers } from "@/components/trip/OnlineUsers";
import { Modal } from "@/components/ui/Modal";
import { TreePine, ClipboardList } from "lucide-react";

function getDayPrefecture(day: number, trip: Trip): { prefectureCode: number; subRegion?: string } {
  const info = trip.dayInfos?.[day - 1];
  if (info?.prefectureCode) {
    return { prefectureCode: info.prefectureCode, subRegion: info.subRegion };
  }
  return { prefectureCode: trip.prefectureCode, subRegion: trip.subRegion };
}

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
  const [showSnsShare, setShowSnsShare] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "packing">("timeline");
  const [showDayPrefSelector, setShowDayPrefSelector] = useState(false);

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

  const days = trip.days || 1;
  const { prefectureCode: dayPrefCode, subRegion: daySubRegion } = getDayPrefecture(activeDay, trip);
  const prefecture = getPrefecture(dayPrefCode, daySubRegion);
  const dayPrefName = prefectures[dayPrefCode]?.name;

  if (!prefecture) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-sub">
        都道府県データが見つかりません
      </div>
    );
  }

  const daySpots = spots.filter(
    (s) => s.day === activeDay || (!s.day && activeDay === 1)
  );

  const handleSpotClick = (_spot: Spot) => {
    // ピンタップ時は名前表示のみ（PrefectureMap内でラベルトグル）
  };

  const handleEditSpot = (spot: Spot) => {
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
    currentInfos[day - 1] = { ...currentInfos[day - 1], label };
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

  const handleChangeDayPrefecture = () => {
    setShowDayPrefSelector(true);
  };

  const handleDayPrefectureSelect = async (code: number, subRegion?: string) => {
    const currentInfos = [...(trip.dayInfos || [])];
    while (currentInfos.length < activeDay) {
      currentInfos.push({});
    }
    currentInfos[activeDay - 1] = {
      ...currentInfos[activeDay - 1],
      prefectureCode: code,
      subRegion,
    };
    await getStorageAdapter().updateTrip(tripId, { dayInfos: currentInfos });
    await refresh();
    setShowDayPrefSelector(false);
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
    <div className="h-dvh flex flex-col overflow-hidden">
      <TripHeader
        trip={trip}
        onEditName={handleEditName}
        onShare={() => setShowShare(true)}
        onSnsShare={() => setShowSnsShare(true)}
        onlineUsers={onlineUsers}
      />

      {/* Scrollable area: map + overlapping content */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-none">
        {/* Map Section */}
        <div className="px-2 pt-2 pb-0 flex items-center justify-center bg-cream/50">
          <PrefectureMap
            prefecture={prefecture}
            spots={daySpots}
            onSpotClick={handleSpotClick}
          />
        </div>

        {/* Content card overlapping map */}
        <div className="relative -mt-6 bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)] min-h-[60vh]">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-border rounded-full" />
          </div>

          {/* Tab bar */}
          <div className="px-4 pt-1 pb-1 flex gap-1">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-bold rounded-xl transition-colors ${
                activeTab === "timeline"
                  ? "text-coral bg-coral/10"
                  : "text-text-sub hover:text-text"
              }`}
            >
              <TreePine size={14} />
              タイムライン
            </button>
            <button
              onClick={() => setActiveTab("packing")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-bold rounded-xl transition-colors ${
                activeTab === "packing"
                  ? "text-coral bg-coral/10"
                  : "text-text-sub hover:text-text"
              }`}
            >
              <ClipboardList size={14} />
              持ち物リスト
            </button>
          </div>

          {/* Tab content */}
          <div className="px-4 pt-2 pb-8">
            {activeTab === "timeline" ? (
              <TimelineTree
                spots={spots}
                days={days}
                dayInfos={trip.dayInfos}
                activeDay={activeDay}
                onActiveDayChange={setActiveDay}
                onReorder={reorderSpots}
                onEditSpot={handleEditSpot}
                onDeleteSpot={handleDeleteSpotDirect}
                onAddClick={handleAddClick}
                onAddDay={handleAddDay}
                onRemoveDay={handleRemoveDay}
                onUpdateDayLabel={handleUpdateDayLabel}
                onChangeDayPrefecture={handleChangeDayPrefecture}
                dayPrefectureName={dayPrefName}
              />
            ) : (
              <PackingList tripId={tripId} />
            )}
          </div>
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
          prefectureCode={dayPrefCode}
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

      {/* Day Prefecture Selector Modal */}
      <Modal
        isOpen={showDayPrefSelector}
        onClose={() => setShowDayPrefSelector(false)}
        title={`${activeDay}日目のエリアを選択`}
      >
        <PrefectureSelector onSelect={handleDayPrefectureSelect} />
      </Modal>

      {/* SNS Share Modal */}
      <SnsShareModal
        trip={trip}
        isOpen={showSnsShare}
        onClose={() => setShowSnsShare(false)}
        onUpdate={refresh}
      />
    </div>
  );
}
