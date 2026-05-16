"use client";

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { useCardAnimations } from '../hooks/useCardAnimations';

interface CardProps {
  index: number;
}

/**
 * PROJECT TRINITY - Card Component
 * 
 * Performance: React.memo() prevents re-renders unless the index changes.
 * State: Subscribes ONLY to its specific card data in the store (EC-002).
 * Animations: Uses Framer Motion variants with thermal fallbacks (EC-004).
 */
const Card: React.FC<CardProps> = memo(({ index }) => {
  const card = useGameStore((state) => state.cards[index]);
  const isThermalThrottled = useGameStore((state) => state.ux.isThermalThrottled);
  
  // Custom hook for Framer Motion variants with adaptive quality
  const { variants, activeVariant } = useCardAnimations(
    card?.isRevealed || false,
    false, // isTrioMember would come from game logic
    false  // isFailedReveal would come from game logic
  );

  if (!card) {
    return (
      <div className="w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36 bg-white/5 rounded-lg border border-white/10 animate-pulse" />
    );
  }

  return (
    <motion.div
      variants={variants}
      animate={activeVariant}
      initial="hidden_deck"
      data-tutorial="board-card"
      className={`
        relative w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36 
        rounded-xl border-2 transform-gpu
        ${card.isRevealed 
          ? `bg-gradient-to-br from-white to-gray-200 border-yellow-500 ${!isThermalThrottled ? 'shadow-[0_0_15px_rgba(234,179,8,0.3)]' : ''}` 
          : `bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 ${!isThermalThrottled ? 'shadow-xl' : ''} cursor-pointer hover:border-blue-400/50 hover:scale-[1.02]`}
      `}
    >
      {card.isRevealed ? (
        <div className="flex flex-col items-center justify-center h-full">
          <span className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-800 select-none">
            {card.value}
          </span>
          <div className="absolute top-2 left-2 text-[10px] font-bold text-slate-400">
            {card.value}
          </div>
          <div className="absolute bottom-2 right-2 text-[10px] font-bold text-slate-400 rotate-180">
            {card.value}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full group">
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border-2 border-blue-500/20 rounded-full flex items-center justify-center transition-colors group-hover:border-blue-500/40">
            <div className="w-4 h-4 sm:w-6 sm:h-6 bg-blue-500/10 rounded-full flex items-center justify-center">
               <span className="text-blue-500/30 text-xs font-bold">T</span>
            </div>
          </div>
          {/* Subtle pattern for back of card - Reduced complexity if throttled */}
          {!isThermalThrottled && (
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden rounded-xl">
               <div className="absolute inset-[-100%] bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,white_10px,white_11px)]" />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
});

Card.displayName = 'Card';

export default Card;
