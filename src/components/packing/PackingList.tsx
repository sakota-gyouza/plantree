"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Package } from "lucide-react";
import { usePackingItems } from "@/lib/hooks/usePackingItems";

interface PackingListProps {
  tripId: string;
}

export function PackingList({ tripId }: PackingListProps) {
  const { items, loading, addItem, toggleItem, renameItem, deleteItem, checkedCount, totalCount } =
    usePackingItems(tripId);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addItem(newName.trim());
    setNewName("");
  };

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleFinishEdit = async () => {
    if (editingId && editingName.trim()) {
      const item = items.find((i) => i.id === editingId);
      if (item && item.name !== editingName.trim()) {
        await renameItem(editingId, editingName.trim());
      }
    }
    setEditingId(null);
    setEditingName("");
  };

  if (loading) {
    return (
      <div className="text-center text-text-sub py-8">読み込み中...</div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Progress */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-sm text-text-sub">
          <Package size={14} />
          <span>
            {checkedCount}/{totalCount} 準備完了
          </span>
        </div>
        {totalCount > 0 && (
          <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-coral rounded-full transition-all"
              style={{
                width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Add input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="持ち物を追加..."
          className="flex-1 px-4 py-2.5 bg-cream border-2 border-border rounded-xl text-sm text-text placeholder:text-text-sub/50 focus:outline-none focus:border-coral transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={!newName.trim()}
          className="px-3 py-2.5 bg-coral text-white rounded-xl disabled:opacity-50 active:scale-95 transition-all"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Items list */}
      {totalCount === 0 ? (
        <div className="text-center py-12 text-text-sub">
          <div className="text-4xl mb-3">🎒</div>
          <p className="text-sm">持ち物を追加してみましょう</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-border/50"
              >
                <button
                  onClick={() => toggleItem(item.id, !item.checked)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    item.checked
                      ? "bg-coral border-coral text-white"
                      : "border-border hover:border-coral"
                  }`}
                >
                  {item.checked && <span className="text-xs">✓</span>}
                </button>
                {editingId === item.id ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleFinishEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleFinishEdit();
                      if (e.key === "Escape") {
                        setEditingId(null);
                        setEditingName("");
                      }
                    }}
                    className="flex-1 text-sm text-text bg-cream border border-coral rounded-lg px-2 py-0.5 focus:outline-none"
                  />
                ) : (
                  <span
                    onClick={() => handleStartEdit(item.id, item.name)}
                    className={`flex-1 text-sm cursor-text ${
                      item.checked ? "line-through text-text-sub" : "text-text"
                    }`}
                  >
                    {item.name}
                  </span>
                )}
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-text-sub/40 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
