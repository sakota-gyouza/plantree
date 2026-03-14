"use client";

import { ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  compact?: boolean;
}

export function Modal({ isOpen, onClose, children, title, compact }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`fixed z-50 flex flex-col overflow-hidden bg-white shadow-xl ${
              compact
                ? "inset-x-4 bottom-[5%] top-[5%] rounded-2xl"
                : "inset-x-4 top-[10%] bottom-[10%] rounded-3xl"
            }`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {title && (
              <div className={compact ? "px-4 pt-3 pb-2 border-b border-border flex items-center justify-between" : "px-5 pt-4 pb-3 border-b border-border flex items-center justify-between"}>
                <h2 className={compact ? "text-sm font-bold text-text" : "text-base font-bold text-text"}>{title}</h2>
                <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-cream text-text-sub hover:text-text hover:bg-border transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <div className={compact ? "flex-1 overflow-y-auto p-4" : "flex-1 overflow-y-auto p-5"}>{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
