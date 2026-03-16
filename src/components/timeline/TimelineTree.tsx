"use client";

import { useState } from "react";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { Plus, X, Calendar, Route, MapPin } from "lucide-react";
import { Spot, DayInfo } from "@/types/trip";
import { TimelineItem } from "./TimelineItem";

interface TimelineTreeProps {
  spots: Spot[];
  days: number;
  dayInfos?: DayInfo[];
  activeDay: number;
  onActiveDayChange: (day: number) => void;
  onReorder: (spotIds: string[]) => void;
  onEditSpot: (spot: Spot) => void;
  onDeleteSpot: (spotId: string) => void;
  onAddClick: (day: number) => void;
  onAddDay: () => void;
  onRemoveDay: (day: number) => void;
  onUpdateDayLabel: (day: number, label: string | undefined) => void;
  onChangeDayPrefecture?: (day: number) => void;
  dayPrefectureName?: string;
}

function getDayLabel(day: number, dayInfos?: DayInfo[]): string {
  const info = dayInfos?.[day - 1];
  if (info?.label) return info.label;
  return `${day}日目`;
}

export function TimelineTree({
  spots,
  days,
  dayInfos,
  activeDay,
  onActiveDayChange,
  onReorder,
  onEditSpot,
  onDeleteSpot,
  onAddClick,
  onAddDay,
  onRemoveDay,
  onUpdateDayLabel,
  onChangeDayPrefecture,
  dayPrefectureName,
}: TimelineTreeProps) {
  const [editingDayLabel, setEditingDayLabel] = useState<number | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const [openSpotId, setOpenSpotId] = useState<string | null>(null);
  const [showDistance, setShowDistance] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const currentDay = Math.min(activeDay, days);

  const daySpots = spots.filter(
    (s) => s.day === currentDay || (!s.day && currentDay === 1)
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = daySpots.findIndex((s) => s.id === active.id);
      const newIndex = daySpots.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(daySpots, oldIndex, newIndex);
      const otherSpots = spots.filter(
        (s) => s.day !== currentDay && (s.day || currentDay !== 1)
      );
      onReorder([...otherSpots, ...reordered].map((s) => s.id));
    }
  }

  const handleStartEditLabel = (day: number) => {
    const current = dayInfos?.[day - 1]?.label || "";
    setLabelInput(current);
    setEditingDayLabel(day);
  };

  const handleSaveLabel = () => {
    if (editingDayLabel === null) return;
    const trimmed = labelInput.trim();
    onUpdateDayLabel(editingDayLabel, trimmed || undefined);
    setEditingDayLabel(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Day tabs */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto scrollbar-hide pb-1">
        {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
          const isActive = day === currentDay;
          const label = getDayLabel(day, dayInfos);
          return (
            <button
              key={day}
              onClick={() => onActiveDayChange(day)}
              className={`relative flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                isActive
                  ? "bg-coral text-white shadow-sm"
                  : "bg-white text-text-sub hover:bg-peach/30 border border-border"
              }`}
            >
              {label}
            </button>
          );
        })}

        {/* Add day tab */}
        <button
          onClick={onAddDay}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full border-2 border-dashed border-sky/40 text-sky hover:border-sky hover:bg-sky/10 transition-all"
          title="日にちを追加"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Day actions bar */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <button
          onClick={() => handleStartEditLabel(currentDay)}
          className="flex items-center gap-1 text-[10px] text-text-sub hover:text-coral transition-colors"
          title="日付に変更"
        >
          <Calendar size={10} />
          {dayInfos?.[currentDay - 1]?.label ? "日付を変更" : "日付を設定"}
        </button>
        {onChangeDayPrefecture && (
          <button
            onClick={() => onChangeDayPrefecture(currentDay)}
            className="flex items-center gap-1 text-[10px] text-text-sub hover:text-coral transition-colors"
            title="エリアを変更"
          >
            <MapPin size={10} />
            {dayPrefectureName || "エリア変更"}
          </button>
        )}
        {daySpots.length >= 2 && (
          <button
            onClick={() => setShowDistance((v) => !v)}
            className={`flex items-center gap-1 text-[10px] transition-colors ${
              showDistance ? "text-coral font-bold" : "text-text-sub hover:text-coral"
            }`}
          >
            <Route size={10} />
            距離
          </button>
        )}
        <div className="flex-1" />
        {days > 1 && (
          <button
            onClick={() => {
              onRemoveDay(currentDay);
              if (currentDay > 1) onActiveDayChange(currentDay - 1);
            }}
            className="flex items-center gap-1 text-[10px] text-text-sub/50 hover:text-red-400 transition-colors"
          >
            <X size={10} />
            この日を削除
          </button>
        )}
      </div>

      {/* Date label edit inline */}
      {editingDayLabel !== null && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <input
            type="date"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            className="flex-1 px-2 py-1 bg-cream border border-border rounded-lg text-xs text-text focus:outline-none focus:border-coral"
            autoFocus
          />
          <button
            onClick={handleSaveLabel}
            className="px-2 py-1 bg-coral text-white text-xs font-bold rounded-lg"
          >
            OK
          </button>
          <button
            onClick={() => {
              onUpdateDayLabel(editingDayLabel, undefined);
              setEditingDayLabel(null);
            }}
            className="px-2 py-1 text-text-sub text-xs font-bold hover:text-text"
          >
            リセット
          </button>
        </div>
      )}

      {/* Spots list for active day */}
      <div className="flex-1">
        {daySpots.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-3xl mb-2">📍</div>
            <p className="text-text-sub text-sm mb-1">スポットがありません</p>
            <p className="text-text-sub text-xs">
              地図をタップするか下のボタンで追加
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={daySpots.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {daySpots.map((spot, index) => (
                <TimelineItem
                  key={spot.id}
                  spot={spot}
                  nextSpot={daySpots[index + 1]}
                  showDistance={showDistance}
                  index={index}
                  isLast={index === daySpots.length - 1}
                  isOpen={openSpotId === spot.id}
                  onToggle={() =>
                    setOpenSpotId(openSpotId === spot.id ? null : spot.id)
                  }
                  onEdit={() => onEditSpot(spot)}
                  onDelete={() => onDeleteSpot(spot.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}

        {/* Add spot button */}
        <button
          onClick={() => onAddClick(currentDay)}
          className="flex items-center gap-2 justify-center py-3 text-coral hover:text-coral-dark font-bold text-sm transition-colors w-full"
        >
          <Plus size={16} />
          スポットを追加
        </button>
      </div>
    </div>
  );
}
