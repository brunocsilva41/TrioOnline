"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import { usePreloader } from "../AssetPreloader";
import CardImage from "../CardImage";

/**
 * Casino-style card dealing animation with actual card back images.
 */
export default function DealingCinematic() {
  const players = useGameStore((s) => s.players);
  const handSize = useGameStore((s) => s.handSize);
  const tableCardCount = useGameStore((s) => s.tableCardCount);
  const [showCards, setShowCards] = useState(false);
  const { isReady, progress } = usePreloader();

  const playerList = useMemo(() => Object.values(players), [players]);
  const totalCards = playerList.length * (handSize || 7) + (tableCardCount || 15);

  useEffect(() => {
    if (!isReady) return;
    const t = setTimeout(() => setShowCards(true), 250);
    return () => clearTimeout(t);
  }, [isReady]);

  // Generate dealing card animations
  const dealCards = useMemo(() => {
    const cards: Array<{ id: number; delay: number; x: number; y: number; rotation: number }> = [];
    const count = Math.min(totalCards, 36);

    for (let i = 0; i < count; i++) {
      // Spread cards in an elliptical pattern around center
      const angle = (i / count) * Math.PI * 2;
      const rx = 120 + Math.random() * 80;
      const ry = 80 + Math.random() * 50;
      cards.push({
        id: i,
        delay: i * 0.04 + 0.3,
        x: Math.cos(angle) * rx + (Math.random() - 0.5) * 30,
        y: Math.sin(angle) * ry + (Math.random() - 0.5) * 20,
        rotation: (Math.random() - 0.5) * 15,
      });
    }
    return cards;
  }, [totalCards]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 50%, #0a1a14 0%, #020617 70%)" }}
    >
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_transparent_30%,_rgba(0,0,0,0.7)_100%)]" />

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-16 z-20 text-center"
      >
        <h2 className="text-sm font-bold tracking-[0.4em] text-emerald-400/70 uppercase">
          Dealing Cards
        </h2>
        <p className="text-[10px] text-white/30 mt-1 font-mono">
          {playerList.length} players &bull; {handSize || 7} cards each
        </p>
      </motion.div>

      {!isReady && (
        <div className="absolute bottom-14 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-2">
          <div className="h-1 w-52 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.65)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300/60">
            Preparando cartas {Math.round(progress)}%
          </span>
        </div>
      )}

      {/* Central deck stack */}
      <div className="relative z-10">
        {/* Stacked deck */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={`stack-${i}`}
            initial={{ opacity: 1 }}
            animate={showCards ? { opacity: 0, scale: 0.8 } : {}}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="absolute w-[68px] h-[102px] rounded-lg overflow-hidden shadow-xl"
            style={{ top: -i * 2, left: i * 1 }}
          >
            <CardImage
              src="/cards/trio_back_card.webp"
              alt="deck"
              className="rounded-lg"
              eager
            />
          </motion.div>
        ))}
      </div>

      {/* Flying cards */}
      {showCards && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          {dealCards.map((card) => (
            <motion.div
              key={card.id}
              className="absolute w-[52px] h-[78px] rounded-lg overflow-hidden shadow-lg"
              initial={{ x: 0, y: 0, scale: 0.5, opacity: 0, rotate: 0 }}
              animate={{
                x: card.x,
                y: card.y,
                scale: 0.7,
                opacity: 1,
                rotate: card.rotation,
              }}
              transition={{
                delay: card.delay,
                duration: 0.4,
                type: "spring",
                stiffness: 100,
                damping: 12,
              }}
            >
              <CardImage
                src="/cards/trio_back_card.webp"
                alt="card"
                className="rounded-lg"
                eager
              />
              {/* Motion blur effect */}
              <motion.div
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 0 }}
                transition={{ delay: card.delay, duration: 0.3 }}
                className="absolute inset-0 bg-emerald-400/10"
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Player names around */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        {playerList.map((player, i) => {
          const angle = (i / playerList.length) * Math.PI * 2 - Math.PI / 2;
          const x = 50 + 35 * Math.cos(angle);
          const y = 50 + 30 * Math.sin(angle);
          return (
            <motion.div
              key={player.sessionId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 1 + i * 0.15 }}
              className="absolute text-center"
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
            >
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                <span className="text-xs font-bold text-white/50">
                  {player.displayName?.charAt(0) || "?"}
                </span>
              </div>
              <p className="text-[9px] text-white/30 mt-1 whitespace-nowrap">{player.displayName}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
