"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { PlayerData } from "../../store/useGameStore";

interface Props {
  player: PlayerData;
  isMe: boolean;
  isHost: boolean;
  onKick: () => void;
}

const PlayerSlot = forwardRef<HTMLDivElement, Props>(function PlayerSlot({ player, isMe, isHost, onKick }, ref) {
  const initial = player.displayName?.charAt(0)?.toUpperCase() || "?";
  const isPlayerHost = player.isHost;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.6, y: -20 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={`relative aspect-[3/4] rounded-xl border overflow-hidden flex flex-col items-center justify-center p-3 group
        ${isMe ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/10 bg-white/[0.03]'}
        ${player.isReady ? 'ring-1 ring-emerald-500/20' : ''}
      `}
    >
      {/* Host crown */}
      {isPlayerHost && (
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute top-2 left-2"
        >
          <span className="text-amber-400 text-sm">&#9813;</span>
        </motion.div>
      )}

      {/* Kick button (host only, not self) */}
      {isHost && !isMe && !isPlayerHost && (
        <button
          onClick={onKick}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-rose-500/0 hover:bg-rose-500/20
            flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
        >
          <span className="text-rose-400 text-[10px] font-bold">X</span>
        </button>
      )}

      {/* Avatar */}
      <motion.div
        animate={player.isOnline ? {
          scale: [1, 1.02, 1],
        } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center mb-3
          ${player.isOnline ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10' : 'bg-white/5 grayscale'}
          ${player.isReady ? 'ring-2 ring-emerald-400/50' : 'ring-1 ring-white/10'}
        `}
      >
        <span className={`text-xl font-black ${player.isOnline ? 'text-emerald-300' : 'text-white/30'}`}>
          {initial}
        </span>

        {/* Online indicator */}
        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#020617]
          ${player.isOnline ? (player.isAfk ? 'bg-amber-400' : 'bg-emerald-400') : 'bg-rose-400'}
        `} />
      </motion.div>

      {/* Name */}
      <p className={`text-[11px] font-bold truncate max-w-full ${isMe ? 'text-emerald-300' : 'text-white/80'}`}>
        {player.displayName}
        {isMe && <span className="text-emerald-500/60 ml-1">(você)</span>}
      </p>

      {/* Ready status */}
      <motion.div
        initial={false}
        animate={{
          opacity: player.isReady ? 1 : 0.4,
          scale: player.isReady ? 1 : 0.9,
        }}
        className="mt-2"
      >
        <span className={`text-[9px] font-black tracking-wider uppercase
          ${player.isReady ? 'text-emerald-400' : 'text-white/30'}
        `}>
          {isPlayerHost ? "HOST" : player.isReady ? "PRONTO" : "AGUARDANDO"}
        </span>
      </motion.div>

      {/* Ready glow effect */}
      {player.isReady && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="absolute inset-0 bg-emerald-400/10 rounded-xl" />
        </motion.div>
      )}
    </motion.div>
  );
});

export default PlayerSlot;
