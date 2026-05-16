"use client";

import React, { memo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { useAdaptiveQuality } from '../hooks/useAdaptiveQuality';
import Card from './Card';
import PlayerAvatar from './PlayerAvatar';

/**
 * PROJECT TRINITY - RoomStatusHUD Component (Internal)
 */
const RoomStatusHUD = memo(() => {
  const status = useGameStore((state) => state.status);
  const isThermalThrottled = useGameStore((state) => state.ux.isThermalThrottled);

  return (
    <div className={`px-6 py-2 rounded-full bg-black/60 border border-white/10 ${!isThermalThrottled ? 'backdrop-blur-xl shadow-2xl' : ''}`}>
      <span className="text-xs font-black tracking-[0.3em] text-emerald-400 uppercase">
        {status.replace(/_/g, ' ')}
      </span>
    </div>
  );
});
RoomStatusHUD.displayName = 'RoomStatusHUD';

/**
 * PROJECT TRINITY - TimerBar Component (Internal)
 */
const TimerBar = memo(() => {
  const currentTick = useGameStore((state) => state.currentTick);
  const expirationTick = useGameStore((state) => state.expirationTick);

  if (expirationTick <= 0) return null;

  const progress = Math.max(0, Math.min(100, ((expirationTick - currentTick) / 300) * 100));

  return (
    <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mt-1 border border-white/5">
      <div 
        className={`h-full transition-all duration-1000 ease-linear ${
          progress < 20 ? 'bg-rose-500' : 'bg-emerald-500'
        }`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
});
TimerBar.displayName = 'TimerBar';

/**
 * PROJECT TRINITY - GameTable Component
 * 
 * The main orchestrator for the game board. 
 * Handles the positioning of players and the 36-card grid.
 * Optimized with React.memo and atomic store subscriptions.
 * 
 * COMPLIANCE [EC-004]: Implements useAdaptiveQuality for thermal defense.
 */
const GameTable: React.FC = memo(() => {
  const cardCount = useGameStore((state) => state.cards.length);
  const playerIds = useGameStore((state) => Object.keys(state.players).join(',')).split(',').filter(Boolean);
  const isThermalThrottled = useGameStore((state) => state.ux.isThermalThrottled);

  // Initialize thermal/battery monitoring
  useAdaptiveQuality();

  // Layout positioning for up to 4 players in a "AAA" table style
  const playerPositions = [
    "bottom-12 left-1/2 -translate-x-1/2", // Player 1 (Self/Bottom)
    "left-12 top-1/2 -translate-y-1/2",    // Player 2 (Left)
    "top-12 left-1/2 -translate-x-1/2",    // Player 3 (Top)
    "right-12 top-1/2 -translate-y-1/2",   // Player 4 (Right)
  ];

  return (
    <div className="relative w-full h-screen bg-[#0a0a0a] overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Background AAA Elements & Ambient Lighting - Disabled when throttled */}
      {!isThermalThrottled && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.05)_0%,_rgba(0,0,0,1)_100%)] pointer-events-none" />
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          
          {/* Dynamic Ambient Light Points */}
          <div className="absolute top-0 left-1/4 w-1/2 h-1/4 bg-blue-500/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-1/2 h-1/4 bg-emerald-500/5 blur-[120px] pointer-events-none" />
        </>
      )}

      {/* Room Status & Timer HUD */}
      <div className="absolute top-8 flex flex-col items-center gap-2 z-20">
        <RoomStatusHUD />
        <TimerBar />
      </div>

      {/* Players Layout around the table */}
      <div className="absolute inset-0 pointer-events-none">
        {playerIds.map((pid, idx) => (
          <div 
            key={pid}
            className={`absolute pointer-events-auto transition-all duration-700 ${playerPositions[idx % playerPositions.length]}`}
          >
            <PlayerAvatar sessionId={pid} />
          </div>
        ))}
      </div>

      {/* Central Board (36 Cards) */}
      <div className="relative group scale-90 sm:scale-100 transition-transform duration-500">
        {/* Under-board Atmospheric Glow - Disabled when throttled */}
        {!isThermalThrottled && (
          <div className="absolute -inset-12 bg-blue-500/5 blur-[80px] rounded-[5rem] pointer-events-none opacity-50" />
        )}
        
        {/* Card Grid Container */}
        <div className={`relative grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 gap-3 sm:gap-4 p-6 sm:p-10 bg-white/[0.01] rounded-[3rem] border border-white/5 ${!isThermalThrottled ? 'backdrop-blur-md shadow-2xl' : ''}`}>
          {Array.from({ length: cardCount || 36 }).map((_, index) => (
            <Card key={index} index={index} />
          ))}
        </div>
      </div>

      {/* Branding / Footer */}
      <div className="absolute bottom-6 flex items-center gap-6 opacity-20 hover:opacity-40 transition-opacity duration-500">
        <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        <span className="text-[10px] font-black tracking-[0.5em] text-white uppercase select-none">
          Project Trinity // Triple Match Engine
        </span>
        <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      </div>
    </div>
  );
});

GameTable.displayName = 'GameTable';

export default GameTable;
