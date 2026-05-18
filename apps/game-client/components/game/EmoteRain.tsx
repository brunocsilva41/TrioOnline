"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";

export default function EmoteRain() {
  const emoteEvent = useGameStore((s) => s.emoteEvent);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; delay: number; emote: string }>>([]);

  useEffect(() => {
    if (emoteEvent && Date.now() - emoteEvent.ts < 1000) {
      // Spawn 15-20 particles
      const newParticles = Array.from({ length: 20 }).map((_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100, // 0 to 100 vw
        delay: Math.random() * 0.5,
        emote: emoteEvent.emote,
      }));
      
      setParticles(p => [...p, ...newParticles].slice(-40)); // Keep max 40 to avoid lag
      
      // Clear after 3 seconds
      const timer = setTimeout(() => {
        setParticles(p => p.filter(x => !newParticles.find(n => n.id === x.id)));
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [emoteEvent]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[150] overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: "-10vh", x: `${p.x}vw`, opacity: 0, scale: 0.5, rotate: 0 }}
            animate={{ 
              y: "110vh", 
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.5, 1, 0.8],
              rotate: Math.random() > 0.5 ? 360 : -360
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 + Math.random(), delay: p.delay, ease: "easeIn" }}
            className="absolute text-4xl opacity-40 drop-shadow-2xl mix-blend-screen"
          >
            {p.emote}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
