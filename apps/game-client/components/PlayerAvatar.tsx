"use client";

import React, { memo } from 'react';
import { useGameStore } from '../store/useGameStore';

interface PlayerAvatarProps {
  sessionId: string;
}

/**
 * PROJECT TRINITY - PlayerAvatar Component
 * 
 * Displays player identity, online status, and collected trios.
 * Highlights the active player with high-fidelity visual feedback.
 */
const PlayerAvatar: React.FC<PlayerAvatarProps> = memo(({ sessionId }) => {
  const player = useGameStore((state) => state.players[sessionId]);
  const activePlayerSessionId = useGameStore((state) => state.activePlayerSessionId);
  const isThermalThrottled = useGameStore((state) => state.ux.isThermalThrottled);
  const isActive = activePlayerSessionId === sessionId;

  if (!player) return null;

  return (
    <div 
      data-tutorial={!isActive ? "opponent-avatar" : "player-avatar"}
      className={`
      relative flex flex-col items-center gap-3 p-4 rounded-3xl border transition-all duration-500
      ${isActive 
        ? `border-yellow-500/50 bg-yellow-500/5 ${!isThermalThrottled ? 'shadow-[0_0_30px_rgba(234,179,8,0.15)] scale-110' : ''} z-10` 
        : 'border-white/10 bg-white/5 grayscale-[0.5] hover:grayscale-0'}
    `}>
      {/* Active Indicator Halo - Disabled when throttled */}
      {isActive && !isThermalThrottled && (
        <div className="absolute -inset-1 rounded-3xl bg-yellow-500/20 blur-md animate-pulse" />
      )}

      <div className="relative">
        <div className={`
          w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 transition-colors
          ${isActive ? 'border-yellow-500' : 'border-slate-700'}
          bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center
        `}>
          <span className="text-2xl font-black text-white/20 select-none">
            {player.userId.substring(0, 1).toUpperCase()}
          </span>
          {/* Avatar Image Placeholder - Simplified when throttled */}
          {!isThermalThrottled && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />
          )}
        </div>
        
        {/* Status Indicator */}
        <div className={`
          absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#0a0a0a]
          ${player.isOnline ? `bg-emerald-500 ${!isThermalThrottled ? 'shadow-[0_0_10px_rgba(16,185,129,0.5)]' : ''}` : 'bg-rose-500'}
        `} />
      </div>
      
      <div className="text-center space-y-1">
        <p className={`
          text-xs sm:text-sm font-bold tracking-tight truncate w-24 sm:w-32 transition-colors
          ${isActive ? 'text-yellow-400' : 'text-slate-300'}
        `}>
          {player.userId}
        </p>
        
        {/* Score / Trios */}
        <div className="flex gap-1.5 justify-center mt-1">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className={`
                w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border transition-all duration-300
                ${i < player.trios.length 
                  ? `bg-yellow-500 border-yellow-300 ${!isThermalThrottled ? 'shadow-[0_0_8px_rgba(234,179,8,0.6)]' : ''}` 
                  : 'bg-white/5 border-white/10'}
              `} 
            />
          ))}
        </div>
      </div>

      {/* Turn Timer Placeholder (if active) */}
      {isActive && (
         <div className={`absolute -top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-yellow-500 rounded-full ${!isThermalThrottled ? 'shadow-lg' : ''}`}>
            <span className="text-[10px] font-black text-black leading-none whitespace-nowrap">YOUR TURN</span>
         </div>
      )}
    </div>
  );
});

PlayerAvatar.displayName = 'PlayerAvatar';

export default PlayerAvatar;
