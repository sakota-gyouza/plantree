"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TreePine, List, LogOut, Users, Camera, MessageCircle, Download } from "lucide-react";
import { useTrips } from "@/lib/hooks/useTrips";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoginButton } from "@/components/auth/LoginButton";
import { Modal } from "@/components/ui/Modal";
import { PrefectureSelector } from "@/components/prefecture/PrefectureSelector";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ProfileService } from "@/lib/services/profileService";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const { createTrip } = useTrips();
  const { user, loading: authLoading, avatarUrl, signOut, refreshAvatar } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPrefecture, setSelectedPrefecture] = useState<number | null>(null);
  const [selectedSubRegion, setSelectedSubRegion] = useState<string | undefined>(undefined);
  const [tripName, setTripName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  const handleSelectPrefecture = (code: number, subRegion?: string) => {
    setSelectedPrefecture(code);
    setSelectedSubRegion(subRegion);
  };

  const handleCreate = async () => {
    if (!selectedPrefecture || !tripName.trim()) return;
    try {
      const trip = await createTrip({
        name: tripName.trim(),
        prefectureCode: selectedPrefecture,
        subRegion: selectedSubRegion,
        days: 1,
        spots: [],
      });
      router.push(`/trip/${trip.id}`);
    } catch (err) {
      console.error("Trip creation failed:", err);
      alert("プラン作成に失敗しました: " + JSON.stringify(err));
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const service = new ProfileService(createClient());
      await service.uploadAvatar(file);
      await refreshAvatar();
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendFeedback = async () => {
    if (!feedback.trim()) return;
    try {
      const supabase = createClient();
      await supabase.from("feedback").insert({
        message: feedback.trim(),
        user_id: user?.id ?? null,
        user_name: user?.user_metadata?.full_name ?? null,
      });
      setFeedbackSent(true);
      setFeedback("");
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackSent(false);
      }, 1500);
    } catch (err) {
      console.error("Feedback failed:", err);
    }
  };

  const displayAvatarUrl = avatarUrl || user?.user_metadata?.avatar_url;

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
          <button
            onClick={handleAvatarClick}
            disabled={uploading}
            className="relative group"
          >
            {displayAvatarUrl ? (
              <img
                src={displayAvatarUrl}
                alt=""
                className="w-9 h-9 rounded-full border-2 border-border object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-coral text-white flex items-center justify-center text-sm font-bold">
                {(user.user_metadata?.full_name || user.email || "?")[0]}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={14} className="text-white" />
            </div>
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <motion.div
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                />
              </div>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
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
        <p className="text-text-sub text-sm">旅や遊びのプランを可愛く作ろう</p>
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
          <div className="mt-2 flex flex-col items-center gap-2">
            <p className="text-xs text-text-sub">ログインするとプランが記録されるよ 🌱</p>
            <LoginButton />
          </div>
        )}
        {!authLoading && user && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-text-sub">
            {displayAvatarUrl ? (
              <img
                src={displayAvatarUrl}
                alt=""
                className="w-6 h-6 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-coral text-white flex items-center justify-center text-xs font-bold">
                {(user.user_metadata?.full_name || user.email || "?")[0]}
              </div>
            )}
            <span>{user.user_metadata?.full_name || user.email}でログイン中</span>
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

      {/* Fixed bottom buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3">
        {/* Install tooltip - browser only */}
        {!isStandalone && (
          <button
            onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const evt = (window as any).__deferredInstallPrompt;
              if (evt) {
                evt.prompt();
              } else {
                setShowInstallGuide(true);
              }
            }}
            className="relative bg-white text-text rounded-2xl shadow-lg px-4 py-2.5 text-xs font-bold border border-border animate-fade-in"
          >
            ホーム画面に追加するともっと使いやすくなります
            <div className="absolute -bottom-1.5 right-[4.5rem] w-3 h-3 bg-white border-r border-b border-border rotate-45" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const evt = (window as any).__deferredInstallPrompt;
              if (evt) {
                evt.prompt();
              } else {
                setShowInstallGuide(true);
              }
            }}
            className="w-12 h-12 bg-white text-coral border-2 border-coral rounded-full shadow-lg flex items-center justify-center hover:bg-coral hover:text-white active:scale-90 transition-all"
            title="ホーム画面に追加"
          >
            <Download size={20} />
          </button>
          <button
            onClick={() => setShowFeedback(true)}
            className="w-12 h-12 bg-coral text-white rounded-full shadow-lg flex items-center justify-center hover:bg-coral-dark active:scale-90 transition-all"
            title="ご意見・ご要望"
          >
            <MessageCircle size={20} />
          </button>
        </div>
      </div>

      {/* Feedback Modal */}
      <Modal
        isOpen={showFeedback}
        onClose={() => {
          setShowFeedback(false);
          setFeedbackSent(false);
        }}
        title="ご意見・ご要望"
        compact
      >
        {feedbackSent ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🙏</div>
            <p className="text-text font-bold">ありがとうございます！</p>
            <p className="text-text-sub text-sm mt-1">いただいたご意見は改善に活かします</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 h-full">
            <p className="text-sm text-text-sub">
              Plantreeをより良くするためのご意見をお聞かせください
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="例: もっとこうしてほしい、ここが使いにくい、こんな機能がほしい..."
              className="w-full flex-1 min-h-[120px] px-4 py-3 bg-cream border-2 border-border rounded-xl text-sm text-text placeholder:text-text-sub/50 focus:outline-none focus:border-coral transition-colors resize-none"
              autoFocus
            />
            <Button
              onClick={handleSendFeedback}
              disabled={!feedback.trim()}
              className="w-full py-3"
            >
              送信する
            </Button>
          </div>
        )}
      </Modal>

      {/* Install Guide Modal */}
      <Modal
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
        title="ホーム画面に追加"
        compact
      >
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="text-5xl">🌳</div>
          <p className="text-center text-base font-bold text-text">
            Plantreeをアプリのように使おう
          </p>
          <p className="text-sm text-text-sub text-center leading-relaxed">
            ブラウザのメニューから<br />
            <span className="font-bold text-text">「ホーム画面に追加」</span><br />
            を選んでね
          </p>
          <div className="w-full bg-cream rounded-xl p-4 text-center">
            <p className="text-xs text-text-sub">
              ホーム画面からいつでもすぐ開けるよ
            </p>
          </div>
          <Button
            onClick={() => setShowInstallGuide(false)}
            className="w-full py-3"
          >
            OK
          </Button>
        </div>
      </Modal>
    </div>
  );
}
