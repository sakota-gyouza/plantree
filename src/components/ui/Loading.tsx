"use client";

import { motion } from "framer-motion";
import { TreePine } from "lucide-react";

interface LoadingProps {
  fullScreen?: boolean;
}

export function Loading({ fullScreen }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >
        <TreePine size={28} className="text-coral" />
      </motion.div>
      <motion.p
        className="text-sm text-text-sub"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >
        読み込み中
      </motion.p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
}
