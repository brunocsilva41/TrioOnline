"use client";

import React, { memo, forwardRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { CardData, useGameStore } from "../store/useGameStore";
import { colyseusService } from "../networking/ColyseusService";

interface CardProps {
  cardData: CardData;
  index: number;
  location: "table" | "hand";
}

/**
 * PROJECT TRINITY - Card Component
 *
 * Uses actual card images from /public/cards/ (webp format).
 * - Face: /cards/card_{value}.webp
 * - Back: /cards/trio_back_card.webp
 * - 3D flip animation on reveal
 * - Interactive when it's the player's turn
 */
const Card = memo(forwardRef<HTMLDivElement, CardProps>(({ cardData, index, location }, ref) => {
  const activePlayerSessionId = useGameStore((s) => s.activePlayerSessionId);
  const mySessionId = useGameStore((s) => s.mySessionId);
  const targetedCardId = useGameStore((s) => s.targetedCardId);

  const isMyTurn = activePlayerSessionId === mySessionId;
  const isRevealed = cardData.isRevealed;
  const isTargeted = targetedCardId === cardData.id;
  const canInteract = location === "table" && isMyTurn && !isRevealed;
  const showFront = isRevealed || location === "hand";

  const handleClick = () => {
    if (!canInteract) return;
    colyseusService.sendRevealTableCard(index);
  };

  // Table cards use clamp for responsive sizing; hand cards managed by parent
  const sizeStyle = location === "table"
    ? { width: "clamp(50px, 4vw, 72px)", height: "clamp(75px, 6vw, 108px)" }
    : undefined;
  const sizeClass = location === "hand"
    ? "w-[52px] h-[78px] sm:w-[60px] sm:h-[90px] md:w-[68px] md:h-[102px]"
    : "";

  return (
    <motion.div
      ref={ref}
      onClick={handleClick}
      whileHover={canInteract ? {
        scale: 1.12,
        y: -8,
        rotateZ: 1,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      } : (location === "hand" ? { y: -12, scale: 1.08 } : {})}
      whileTap={canInteract ? { scale: 0.95 } : {}}
      className={`relative ${sizeClass} select-none flex-shrink-0
        ${canInteract ? "cursor-pointer" : "cursor-default"}
      `}
      style={{ perspective: "800px", ...sizeStyle }}
    >
      {/* 3D Flip Container */}
      <motion.div
        animate={{ rotateY: showFront ? 0 : 180 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 120, damping: 14 }}
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* FRONT FACE */}
        <div
          className="absolute inset-0 rounded-lg overflow-hidden shadow-lg"
          style={{ backfaceVisibility: "hidden" }}
        >
          {cardData.value > 0 && (
            <Image
              src={`/cards/card_${cardData.value}.webp`}
              alt={`Card ${cardData.value}`}
              fill
              sizes="100px"
              className="object-cover rounded-lg"
              priority={location === "hand"}
            />
          )}
          {/* Glow on reveal */}
          {isRevealed && location === "table" && (
            <motion.div
              initial={{ opacity: 0.7, scale: 1 }}
              animate={{ opacity: 0, scale: 1.3 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 bg-emerald-400/20 rounded-lg pointer-events-none"
            />
          )}
          {/* Targeted ring */}
          {isTargeted && (
            <div className="absolute inset-0 rounded-lg ring-2 ring-amber-400 shadow-gold-glow pointer-events-none" />
          )}
        </div>

        {/* BACK FACE */}
        <div
          className="absolute inset-0 rounded-lg overflow-hidden shadow-lg"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <Image
            src="/cards/trio_back_card.webp"
            alt="Card back"
            fill
            sizes="100px"
            className="object-cover rounded-lg"
          />
          {/* Interactive glow pulse */}
          {canInteract && (
            <motion.div
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-lg border-2 border-emerald-400/40 pointer-events-none"
            />
          )}
        </div>
      </motion.div>

      {/* Drop shadow */}
      <div className="absolute inset-x-2 -bottom-1 h-3 bg-black/30 blur-md rounded-full pointer-events-none" />
    </motion.div>
  );
}));

Card.displayName = "Card";
export default Card;
