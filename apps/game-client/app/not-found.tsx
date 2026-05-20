"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import CardImage from "../components/CardImage";

export default function NotFound() {
  const [cardValue, setCardValue] = useState(1);

  // Change card face every full spin (approx every 3s)
  useEffect(() => {
    const interval = setInterval(() => {
      setCardValue((prev) => (prev % 12) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#020617] overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />

      {/* 3D Spinning Card */}
      <motion.div
        animate={{ rotateY: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="relative w-32 h-48 mb-8"
        style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.5)] border-2 border-blue-400"
          style={{ backfaceVisibility: "hidden" }}
        >
          <CardImage value={cardValue} className="rounded-xl" eager />
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl border-2 border-slate-700"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <CardImage src="/cards/trio_back_card.webp" className="rounded-xl" eager />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10"
      >
        <h1 className="text-6xl font-black text-white mb-2 tracking-tighter drop-shadow-md">
          <span className="text-blue-500">4</span>0<span className="text-blue-500">4</span>
        </h1>
        <h2 className="text-sm font-bold tracking-[0.4em] text-white/50 uppercase mb-8">
          A carta que você procura não está neste baralho
        </h2>
        
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs tracking-widest uppercase transition-all shadow-[0_10px_25px_rgba(37,99,235,0.4)]"
          >
            Voltar ao Lobby
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}
