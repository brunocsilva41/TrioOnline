"use client";

import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../store/useGameStore";

interface PlayerAvatarProps {
  sessionId?: string;
  name?: string;
  avatarUrl?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  isActive?: boolean;
  showName?: boolean;
  showStatus?: boolean;
  showBadge?: boolean;
  className?: string;
}

const PlayerAvatar = memo(({
  sessionId,
  name,
  avatarUrl,
  size = "md",
  isActive = false,
  showName = true,
  showStatus = true,
  showBadge = true,
  className = "",
}: PlayerAvatarProps) => {
  const players = useGameStore((s) => s.players);
  const mySid = useGameStore((s) => s.mySessionId);
  
  const player = sessionId ? players[sessionId] : null;
  const isMe = sessionId === mySid;
  
  const finalName = name || player?.displayName || (isMe ? "Você" : "Jogador");
  const finalAvatar = avatarUrl || player?.avatarUrl || "";
  const isOnline = player ? player.isOnline : true;

  const sizeClasses = {
    xs: "w-6 h-6 text-[8px]",
    sm: "w-10 h-10 text-[10px]",
    md: "w-14 h-14 text-xs",
    lg: "w-20 h-20 text-sm",
    xl: "w-28 h-28 text-base",
  };

  const badgeSize = {
    xs: "w-1.5 h-1.5",
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-4 h-4",
    xl: "w-5 h-5",
  };

  return (
    <motion.div 
      className={`relative flex flex-col items-center gap-2 ${className}`}
      initial={false}
      animate={isActive ? { scale: 1.05 } : { scale: 1 }}
    >
      <div className="relative group">
        {/* 3D Glass Surface Container */}
        <div className={`
          relative ${sizeClasses[size]} rounded-full 
          bg-slate-800/40 backdrop-blur-md overflow-hidden
          border border-white/20 shadow-2xl transition-all duration-500
          ${isActive ? "ring-2 ring-emerald-400 ring-offset-4 ring-offset-slate-950" : "hover:border-white/40"}
        `}>
          {finalAvatar ? (
            <img 
              src={finalAvatar} 
              alt={finalName} 
              className={`w-full h-full object-cover transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-black bg-gradient-to-br from-indigo-600/40 to-slate-900/40 text-white uppercase tracking-tighter italic">
              {finalName.substring(0, 2)}
            </div>
          )}

          {/* Depth Shading */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/10 pointer-events-none" />
        </div>

        {/* Online Status Badge */}
        {showStatus && (
          <div className={`absolute -bottom-0.5 -right-0.5 ${badgeSize[size]} rounded-full border-2 border-slate-950 shadow-lg ${isOnline ? "bg-emerald-500" : "bg-slate-600"}`} />
        )}

        {/* Host Badge */}
        {showBadge && player?.isHost && (
          <div className="absolute -top-1 -right-1 bg-amber-500 text-black rounded-full p-1 shadow-lg border-2 border-slate-950">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7Zm3 16h14v2H5v-2Z"/></svg>
          </div>
        )}
      </div>

      {showName && (
        <span className={`
          font-black font-display uppercase tracking-widest text-center px-2 py-0.5 rounded-md truncate max-w-full
          ${isActive ? "text-emerald-400 bg-emerald-500/10" : "text-white/80 bg-black/20"}
        `}>
          {finalName}
        </span>
      )}

      {/* Emote Popover */}
      <AnimatePresence>
        {player?.lastEmote && (Date.now() - player.lastEmoteTick < 3000) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: 1, scale: 1.2, y: -45 }}
            exit={{ opacity: 0, scale: 0.8, y: -60 }}
            className="absolute top-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-md border border-white/20 rounded-full w-12 h-12 text-2xl shadow-[0_0_20px_rgba(0,0,0,0.4)] z-[100]"
          >
            {player.lastEmote}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-white/20" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

PlayerAvatar.displayName = "PlayerAvatar";
export default PlayerAvatar;
