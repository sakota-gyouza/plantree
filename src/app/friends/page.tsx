"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, UserPlus, Users, Clock } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useFriends } from "@/lib/hooks/useFriends";
import { FriendCard } from "@/components/friends/FriendCard";
import { FriendSearch } from "@/components/friends/FriendSearch";
import { LoginButton } from "@/components/auth/LoginButton";

type Tab = "friends" | "requests" | "search";

export default function FriendsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    searchUsers,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
  } = useFriends();
  const [activeTab, setActiveTab] = useState<Tab>("friends");

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="text-4xl"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          🌳
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-4">
        <Users size={48} className="text-text-sub" />
        <p className="text-text-sub text-center">
          フレンド機能を使うにはログインが必要です
        </p>
        <LoginButton />
        <button
          onClick={() => router.push("/")}
          className="text-sm text-text-sub hover:text-coral transition-colors mt-2"
        >
          ← ホームに戻る
        </button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "friends", label: "フレンド", icon: <Users size={14} /> },
    {
      key: "requests",
      label: "リクエスト",
      icon: <Clock size={14} />,
      count: pendingRequests.length,
    },
    { key: "search", label: "検索", icon: <Search size={14} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-cream text-text-sub hover:text-text transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-lg font-bold text-text">フレンド</h1>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-t-xl transition-colors relative ${
                activeTab === tab.key
                  ? "text-coral bg-coral/5"
                  : "text-text-sub hover:text-text"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count ? (
                <span className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-coral text-white text-xs">
                  {tab.count}
                </span>
              ) : null}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-coral rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <AnimatePresence mode="wait">
          {activeTab === "friends" && (
            <motion.div
              key="friends"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-2"
            >
              {loading ? (
                <p className="text-center text-text-sub py-8">読み込み中...</p>
              ) : friends.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <UserPlus size={40} className="text-text-sub/30" />
                  <p className="text-text-sub text-sm">
                    まだフレンドがいません
                  </p>
                  <button
                    onClick={() => setActiveTab("search")}
                    className="text-sm text-coral font-bold hover:underline"
                  >
                    フレンドを探す →
                  </button>
                </div>
              ) : (
                friends.map((f) => {
                  const friend =
                    f.requesterId === user.id ? f.addressee! : f.requester!;
                  return (
                    <FriendCard
                      key={f.id}
                      profile={friend}
                      action={{
                        label: "解除",
                        variant: "danger",
                        onClick: () => removeFriend(f.id),
                      }}
                    />
                  );
                })
              )}
            </motion.div>
          )}

          {activeTab === "requests" && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              {/* 受け取ったリクエスト */}
              {pendingRequests.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-text-sub mb-2">
                    受信したリクエスト
                  </h3>
                  <div className="flex flex-col gap-2">
                    {pendingRequests.map((f) => (
                      <FriendCard
                        key={f.id}
                        profile={f.requester!}
                        action={{
                          label: "承認",
                          variant: "primary",
                          onClick: () => acceptRequest(f.id),
                        }}
                        secondaryAction={{
                          label: "拒否",
                          onClick: () => rejectRequest(f.id),
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 送ったリクエスト */}
              {sentRequests.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-text-sub mb-2">
                    送信したリクエスト
                  </h3>
                  <div className="flex flex-col gap-2">
                    {sentRequests.map((f) => (
                      <FriendCard
                        key={f.id}
                        profile={f.addressee!}
                        action={{
                          label: "待機中",
                          variant: "disabled",
                          onClick: () => {},
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {pendingRequests.length === 0 && sentRequests.length === 0 && (
                <p className="text-center text-text-sub py-12 text-sm">
                  リクエストはありません
                </p>
              )}
            </motion.div>
          )}

          {activeTab === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <FriendSearch
                onSearch={searchUsers}
                onSendRequest={sendRequest}
                existingFriendIds={friends.map((f) =>
                  f.requesterId === user.id ? f.addresseeId : f.requesterId
                )}
                sentRequestIds={sentRequests.map((f) => f.addresseeId)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
