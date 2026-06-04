"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { PlayerData } from "../../store/useGameStore";
import PlayerAvatar from "../PlayerAvatar";

interface Props {
  player: PlayerData;
  isMe: boolean;
  isHost: boolean;
  onKick: () => void;
}

const PlayerSlot = forwardRef<HTMLDivElement, Props>(function PlayerSlot({ player, isMe, isHost, onKick }, ref) {
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
          className="absolute top-2 left-2 z-10"
        >
          <span className="text-amber-400 text-sm">&#9813;</span>
        </motion.div>
      )}

      {/* Kick button (host only, not self) */}
      {isHost && !isMe && !isPlayerHost && (
        <button
          onClick={onKick}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-rose-500/0 hover:bg-rose-500/20
            flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
        >
          <span className="text-rose-400 text-[10px] font-bold">X</span>
        </button>
      )}

      {/* Avatar */}
      <div className="mb-2">
        <PlayerAvatar 
          sessionId={player.sessionId} 
          showName={false} 
          size="md"
        />
      </div>

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
        <span className={`text-[9px] font-black font-display tracking-wider uppercase
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
