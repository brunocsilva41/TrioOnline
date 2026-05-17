"use client";

import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../store/useGameStore";

interface PlayerAvatarProps {
  sessionId: string;
  isActive?: boolean;
}

/**
 * PROJECT TRINITY - PlayerAvatar
 *
 * Shows player presence during gameplay with:
 * - Neon active turn indicator
 * - Thinking animation (bouncing dots)
 * - AFK / offline states
 * - Card count badge
 * - Emote popup
 * - Score/trio markers
 */
const PlayerAvatar: React.FC<PlayerAvatarProps> = memo(({ sessionId, isActive: isActiveProp }) => {
  const player = useGameStore((s) => s.players[sessionId]);
  const activePlayerSessionId = useGameStore((s) => s.activePlayerSessionId);
  const isThermalThrottled = useGameStore((s) => s.isThermalThrottled);
  const mySessionId = useGameStore((s) => s.mySessionId);

  if (!player) return null;

  const isActive = isActiveProp ?? (activePlayerSessionId === sessionId);
  const isMe = sessionId === mySessionId;
  const initial = player.displayName?.charAt(0)?.toUpperCase() || "?";

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative flex flex-col items-center gap-1.5"
    >
      {/* Active turn ring */}
      <div className="relative">
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -inset-1.5 rounded-2xl border-2 border-amber-400/60
              shadow-[0_0_15px_rgba(251,191,36,0.3)]"
          >
            {!isThermalThrottled && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-2px] rounded-2xl border-2 border-transparent border-t-amber-400"
              />
            )}
          </motion.div>
        )}

        {/* Avatar body */}
        <motion.div
          animate={!isThermalThrottled && player.isOnline ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center overflow-hidden
            border transition-all duration-300
            ${isActive ? "border-amber-400/50 bg-amber-900/20" : isMe ? "border-emerald-500/30 bg-emerald-900/10" : "border-white/10 bg-slate-900/60"}
            ${!player.isOnline ? "grayscale opacity-40" : player.isAfk ? "opacity-60" : ""}
          `}
        >
          <span className={`text-lg font-black
            ${isActive ? "text-amber-300" : isMe ? "text-emerald-300" : "text-white/60"}
          `}>
            {initial}
          </span>

          {/* Thinking dots when active */}
          {isActive && !isThermalThrottled && (
            <div className="absolute bottom-1 flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  className="w-1 h-1 bg-amber-400 rounded-full"
                />
              ))}
            </div>
          )}

          {/* AFK Zzz */}
          {player.isAfk && player.isOnline && (
            <motion.span
              animate={{ opacity: [0.3, 0.8, 0.3], y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-0 right-0.5 text-amber-300 text-[9px] font-bold"
            >
              Z
            </motion.span>
          )}
        </motion.div>

        {/* Online status dot */}
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#020617]
          ${!player.isOnline ? "bg-rose-400" : player.isAfk ? "bg-amber-400" : "bg-emerald-400"}
        `} />

        {/* Card count badge */}
        {player.handCount > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-800 border border-white/20
            flex items-center justify-center">
            <span className="text-[8px] font-bold text-white/70">{player.handCount}</span>
          </div>
        )}
      </div>

      {/* Name & score */}
      <div className="text-center max-w-[80px]">
        <p className={`text-[9px] sm:text-[10px] font-bold truncate
          ${isActive ? "text-amber-300" : isMe ? "text-emerald-300" : "text-white/50"}
        `}>
          {player.displayName}
        </p>

        {/* Trio markers */}
        {player.trios.length > 0 && (
          <div className="flex gap-0.5 justify-center mt-0.5">
            {player.trios.map((trio, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 rounded-sm bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]"
              />
            ))}
          </div>
        )}
      </div>

      {/* Emote bubble */}
      <AnimatePresence>
        {player.lastEmote && (
          <motion.div
            initial={{ scale: 0, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: -5, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-8 bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-sm"
          >
            {player.lastEmote}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

PlayerAvatar.displayName = "PlayerAvatar";
export default PlayerAvatar;
