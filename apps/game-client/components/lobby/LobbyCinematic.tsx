"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LobbyCinematicProps {
  onComplete: () => void;
}

/**
 * PROJECT TRINITY - LobbyCinematic
 * 
 * High-fidelity card dealing animation sequence.
 * Features:
 * - 36 Cards flying from off-screen
 * - Random rotations and physical sliding feel
 * - Dynamic shadows and depth (Z-axis)
 * - Motion blur simulation
 */
const LobbyCinematic: React.FC<LobbyCinematicProps> = ({ onComplete }) => {
  const [isDashed, setIsDashed] = useState(false);

  useEffect(() => {
    // Start the animation sequence
    setIsDashed(true);
    
    // Total animation time is roughly:
    // delay of last card (35 * 0.03 = 1.05s) + suspense delay (0.5s) + duration (0.8s) + safety margin
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const cards = Array.from({ length: 36 });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617] overflow-hidden perspective-1000">
      {/* Table Surface (Felt) */}
      <motion.div 
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.1)_0%,_transparent_70%)]"
      />

      {/* Grid Container (Matches GameTable layout for seamless transition) */}
      <div className="relative grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 gap-4 p-12 bg-slate-900/20 rounded-[4rem] border border-white/5 backdrop-blur-xl">
        {cards.map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            initial={{ 
              opacity: 0, 
              scale: 0.5, 
              z: 500,
              x: Math.random() * 2000 - 1000, 
              y: Math.random() * 1000 + 1000,
              rotateZ: Math.random() * 360,
              rotateY: 180
            }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              z: 0,
              x: 0, 
              y: 0,
              rotateZ: Math.random() * 10 - 5, // Small random rotation for "physical" feel
              rotateY: 180, // Stay face down
            }}
            transition={{
              delay: i * 0.03 + 0.5, // Suspense delay
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1], // Custom cubic-bezier for "slide" feel
              type: "spring",
              stiffness: 80,
              damping: 15
            }}
            style={{ 
              transformStyle: "preserve-3d"
            }}
            className="w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36 rounded-2xl bg-slate-900 border-2 border-white/10 flex items-center justify-center relative shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            {/* Motion Blur Overlay (Fade out during transition) */}
            <motion.div 
              initial={{ opacity: 1, scale: 1.1 }}
              animate={{ opacity: 0, scale: 1 }}
              transition={{ delay: i * 0.03 + 0.5, duration: 0.6 }}
              className="absolute inset-0 bg-white/5 blur-xl rounded-2xl pointer-events-none"
            />

            {/* Card Back Logo */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-500/30 rounded-full flex items-center justify-center">
              <span className="text-amber-500 font-black text-xl italic opacity-30">T</span>
            </div>

            {/* Dynamic Shadow (Inner Glow) */}
            <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none" />
          </motion.div>
        ))}
      </div>

      {/* Cinematic Overlays */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute top-12 left-1/2 -translate-x-1/2 text-center"
      >
        <h2 className="text-amber-500 font-black tracking-[0.8em] text-xs italic drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
          INITIALIZING_DEAL_SEQUENCE
        </h2>
      </motion.div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
    </div>
  );
};

export default LobbyCinematic;
