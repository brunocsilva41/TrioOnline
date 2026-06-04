"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../../store/useGameStore";
import { usePreloader } from "../AssetPreloader";

export default function CountdownScreen() {
  const countdown = useGameStore((s) => s.countdown);
  const { isReady, progress } = usePreloader();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Dark overlay with radial light */}
      <div className="absolute inset-0 bg-[#020617]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(52,211,153,0.1)_0%,_transparent_50%)]" />

      {/* Assets Loading Indicator */}
      {!isReady && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-black font-display tracking-[0.3em] text-emerald-500/50 uppercase">
            Carregando Ativos... {Math.round(progress)}%
          </span>
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={countdown}
          initial={{ scale: 2, opacity: 0, filter: "blur(20px)" }}
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
          exit={{ scale: 0.5, opacity: 0, filter: "blur(10px)" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="z-10 text-center"
        >
          {countdown > 0 ? (
            <>
              <motion.span
                className="text-[12rem] sm:text-[16rem] font-black font-display text-emerald-400 leading-none
                  drop-shadow-[0_0_60px_rgba(52,211,153,0.5)]"
                animate={{
                  textShadow: [
                    "0 0 40px rgba(52,211,153,0.3)",
                    "0 0 80px rgba(52,211,153,0.6)",
                    "0 0 40px rgba(52,211,153,0.3)",
                  ],
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {countdown}
              </motion.span>
              <p className="text-xs font-black font-display tracking-[0.5em] text-white/30 uppercase mt-4">
                PREPARE-SE
              </p>
            </>
          ) : (
            <motion.span
              initial={{ scale: 0.5 }}
              animate={{ scale: [1, 1.2, 1] }}
              className="text-6xl sm:text-8xl font-black font-display text-amber-400
                drop-shadow-[0_0_40px_rgba(251,191,36,0.6)]"
            >
              GO!
            </motion.span>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Pulse ring effect */}
      <motion.div
        className="absolute w-64 h-64 rounded-full border-2 border-emerald-400/30"
        animate={{
          scale: [1, 2.5],
          opacity: [0.5, 0],
        }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </motion.div>
  );
}
