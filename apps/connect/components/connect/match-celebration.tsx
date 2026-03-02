"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MediaSlot } from "./media-slot-grid";

interface MatchCelebrationProps {
  matchId: string;
  displayName: string;
  avatarUrl?: string | null;
  featuredImage?: string | null;
  open: boolean;
  onClose: () => void;
}

export function MatchCelebration({
  matchId,
  displayName,
  avatarUrl,
  featuredImage,
  open,
  onClose,
}: MatchCelebrationProps) {
  const router = useRouter();
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setHasEntered(true), 400);
      return () => clearTimeout(timer);
    }
    setHasEntered(false);
  }, [open]);

  const imageUrl = featuredImage || avatarUrl;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onClose}
          />

          {/* Floating particles */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: `hsl(${211 + i * 15}, 100%, ${60 + (i % 3) * 10}%)`,
                left: `${15 + Math.random() * 70}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
                y: [0, -60 - Math.random() * 80],
                x: [(Math.random() - 0.5) * 40],
              }}
              transition={{
                duration: 2 + Math.random(),
                delay: 0.3 + i * 0.1,
                ease: "easeOut",
              }}
            />
          ))}

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center px-6">
            {/* Title */}
            <motion.div
              className="flex items-center gap-2 mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            >
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold text-white font-heading">
                It&apos;s a Match!
              </h2>
              <Sparkles className="h-5 w-5 text-primary" />
            </motion.div>

            {/* 3D spinning card */}
            <div style={{ perspective: "1200px" }}>
              <motion.div
                className="relative w-48 h-64 rounded-2xl overflow-hidden"
                style={{ transformStyle: "preserve-3d" }}
                initial={{ scale: 0.3, rotateY: -180, opacity: 0 }}
                animate={{
                  scale: 1,
                  rotateY: hasEntered ? [0, 360] : 0,
                  opacity: 1,
                }}
                transition={{
                  scale: { type: "spring", stiffness: 200, damping: 15, delay: 0.2 },
                  rotateY: hasEntered
                    ? { duration: 3, ease: "linear", repeat: Infinity }
                    : { type: "spring", stiffness: 100, damping: 12, delay: 0.2 },
                  opacity: { duration: 0.3, delay: 0.2 },
                }}
              >
                {/* Card front */}
                <div
                  className="absolute inset-0 rounded-2xl overflow-hidden"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={displayName}
                      fill
                      sizes="192px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/40 via-primary/20 to-background flex items-center justify-center">
                      <span className="text-5xl font-bold text-primary/30">
                        {displayName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-white font-bold text-sm truncate">
                      {displayName}
                    </p>
                  </div>
                  {/* Glass shine */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Card back */}
                <div
                  className="absolute inset-0 rounded-2xl overflow-hidden glass-card flex items-center justify-center"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <div className="text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                      <MessageCircle className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-semibold">{displayName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      wants to connect
                    </p>
                  </div>
                </div>

                {/* Glow */}
                <div
                  className="absolute -inset-1 rounded-2xl pointer-events-none"
                  style={{
                    boxShadow:
                      "0 0 40px hsl(211 100% 50% / 0.3), 0 0 80px hsl(211 100% 50% / 0.15)",
                  }}
                />
              </motion.div>
            </div>

            {/* Subtitle */}
            <motion.p
              className="text-white/70 text-sm mt-5 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              You and {displayName} liked each other
            </motion.p>

            {/* Action buttons */}
            <motion.div
              className="flex gap-3 mt-6 w-full max-w-xs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, type: "spring" }}
            >
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
                onClick={onClose}
              >
                Keep Swiping
              </Button>
              <Button
                className="flex-1"
                onClick={() => router.push(`/matches/${matchId}`)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
