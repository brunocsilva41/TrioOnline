"use client";

import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../store/useGameStore";

interface PlayerAvatarProps {
  sessionId?: string;
  name?: string;
  avatarUrl?: string;
  isActive?: boolean;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  showBadge?: boolean;
  showName?: boolean;
}

/**
 * PROJECT TRINITY - PlayerAvatar
 *
 * Single source of truth for player avatars.
 * Supports image URLs and initials fallback.
 */
const PlayerAvatar: React.FC<PlayerAvatarProps> = memo(({ 
  sessionId, 
  name: nameProp, 
  avatarUrl: avatarUrlProp,
  isActive: isActiveProp,
  size = "md",
  showStatus = true,
  showBadge = true,
  showName = true
}) => {
  const storePlayer = useGameStore((s) => sessionId ? s.players[sessionId] : null);
  const activePlayerSessionId = useGameStore((s) => s.activePlayerSessionId);
  const isThermalThrottled = useGameStore((s) => s.isThermalThrottled);
  const mySessionId = useGameStore((s) => s.mySessionId);

  const player = storePlayer || {
    displayName: nameProp || "??",
    avatarUrl: avatarUrlProp,
    isOnline: true,
    isAfk: false,
    handCount: 0,
    trios: [],
    lastEmote: null,
  };

  const isActive = isActiveProp ?? (sessionId && activePlayerSessionId === sessionId);
  const isMe = sessionId === mySessionId;
  const initial = player.displayName?.charAt(0)?.toUpperCase() || "?";

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12 sm:w-14 sm:h-14",
    lg: "w-16 h-16 sm:w-20 sm:h-20"
  };

  const fontClasses = {
    sm: "text-[10px]",
    md: "text-lg",
    lg: "text-2xl"
  };

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
            className={`absolute -inset-1.5 rounded-full border-2 border-amber-400/60
              shadow-[0_0_15px_rgba(251,191,36,0.3)]`}
          >
            {!isThermalThrottled && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-2px] rounded-full border-2 border-transparent border-t-amber-400"
              />
            )}
          </motion.div>
        )}

        {/* Avatar body */}
        <motion.div
          animate={!isThermalThrottled && player.isOnline ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className={`relative ${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden
            border transition-all duration-300
            ${isActive ? "border-amber-400/50 bg-amber-900/20" : isMe ? "border-emerald-500/30 bg-emerald-900/10" : "border-white/10 bg-slate-900/60"}
            ${!player.isOnline ? "grayscale opacity-40" : player.isAfk ? "opacity-60" : ""}
          `}
        >
          {player.avatarUrl ? (
            <img src={player.avatarUrl} alt={player.displayName} className="w-full h-full object-cover" />
          ) : (
            <span className={`${fontClasses[size]} font-black
              ${isActive ? "text-amber-300" : isMe ? "text-emerald-300" : "text-white/60"}
            `}>
              {initial}
            </span>
          )}

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
        {showStatus && (
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#020617]
            ${!player.isOnline ? "bg-rose-400" : player.isAfk ? "bg-amber-400" : "bg-emerald-400"}
          `} />
        )}

        {/* Card count badge */}
        {showBadge && player.handCount > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-800 border border-white/20
            flex items-center justify-center">
            <span className="text-[8px] font-bold text-white/70">{player.handCount}</span>
          </div>
        )}
      </div>

      {/* Name & score */}
      {showName && (
        <div className="text-center max-w-[80px]">
          <p className={`text-[9px] sm:text-[10px] font-bold truncate
            ${isActive ? "text-amber-300" : isMe ? "text-emerald-300" : "text-white/50"}
          `}>
            {isMe ? "Você" : player.displayName}
          </p>

          {/* Trio markers */}
          {player.trios && player.trios.length > 0 && (
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
      )}

      {/* Emote bubble */}
      <AnimatePresence>
        {player.lastEmote && (
          <motion.div
            initial={{ scale: 0, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: -5, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-8 bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-sm z-[60]"
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
