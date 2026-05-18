"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface TrioCinematicProps {
  playerName: string;
  cardValue: number;
  onComplete: () => void;
}

export default function TrioCinematic({ playerName, cardValue, onComplete }: TrioCinematicProps) {
  useEffect(() => {
    // End animation and cleanup after 3 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md overflow-hidden pointer-events-none"
    >
      {/* Light burst behind cards */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute w-96 h-96 bg-amber-500/20 rounded-full blur-[100px]"
      />

      {/* Title */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="text-center mb-8"
      >
        <h2 className="text-amber-400 font-black tracking-widest text-2xl uppercase drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
          {playerName} FECHOU UM TRIO!
        </h2>
      </motion.div>

      {/* Cards joining animation */}
      <div className="relative flex items-center justify-center h-48 w-full">
        {/* Left Card */}
        <motion.div
          initial={{ x: -200, y: 100, rotate: -45, opacity: 0, scale: 0.5 }}
          animate={{ x: -40, y: 0, rotate: -10, opacity: 1, scale: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          className="absolute z-10 w-24 h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-amber-400/50"
        >
          <Image src={`/cards/card_${cardValue}.webp`} alt="" fill sizes="96px" className="object-cover" />
        </motion.div>

        {/* Right Card */}
        <motion.div
          initial={{ x: 200, y: 100, rotate: 45, opacity: 0, scale: 0.5 }}
          animate={{ x: 40, y: 0, rotate: 10, opacity: 1, scale: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 100 }}
          className="absolute z-20 w-24 h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-amber-400/50"
        >
          <Image src={`/cards/card_${cardValue}.webp`} alt="" fill sizes="96px" className="object-cover" />
        </motion.div>

        {/* Center Card */}
        <motion.div
          initial={{ y: -200, scale: 2, opacity: 0 }}
          animate={{ y: 0, scale: 1.1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 150 }}
          className="absolute z-30 w-24 h-36 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(251,191,36,0.6)] border-2 border-amber-300"
        >
          <Image src={`/cards/card_${cardValue}.webp`} alt="" fill sizes="120px" className="object-cover" />
          <motion.div
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 bg-white"
          />
        </motion.div>
      </div>

      {/* Sparkles / Particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: 0,
            y: 0,
            scale: 0,
            opacity: 1
          }}
          animate={{
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400,
            scale: Math.random() * 1.5,
            opacity: 0
          }}
          transition={{ duration: 1 + Math.random(), delay: 0.4 }}
          className="absolute w-2 h-2 bg-amber-300 rounded-full blur-[1px]"
        />
      ))}
    </motion.div>
  );
}
