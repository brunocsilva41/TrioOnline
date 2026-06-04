"use client";

import { useState, useEffect, createContext, useContext, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CARD_ASSET_PATHS, preloadCardAsset } from "../lib/cardAssets";

const ASSETS_TO_PRELOAD = [...CARD_ASSET_PATHS];

interface PreloadContextType {
  isReady: boolean;
  progress: number;
}

const PreloadContext = createContext<PreloadContextType>({ isReady: false, progress: 0 });

export const usePreloader = () => useContext(PreloadContext);

/**
 * PROJECT TRINITY - Asset Preloader
 * Orchestrates preloading of all critical game assets (cards).
 * Blocks interaction until essential assets are ready to prevent flickering.
 */
export default function AssetPreloader({ children }: { children: React.ReactNode }) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const assets = ASSETS_TO_PRELOAD;
    let loaded = 0;

    if (assets.length === 0) {
      setIsReady(true);
      return;
    }

    const onLoad = () => {
      loaded++;
      if (mounted) {
        setLoadedCount(loaded);
        if (loaded === assets.length) {
          // Add a small delay for safety and smooth transition
          setTimeout(() => {
            if (mounted) setIsReady(true);
          }, 100);
        }
      }
    };

    // Parallel preloading with decoding
    assets.forEach((src) => {
      preloadCardAsset(src)
        .catch(() => undefined)
        .finally(onLoad);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const progress = useMemo(() => {
    return ASSETS_TO_PRELOAD.length > 0 
      ? (loadedCount / ASSETS_TO_PRELOAD.length) * 100 
      : 100;
  }, [loadedCount]);

  const value = useMemo(() => ({ isReady, progress }), [isReady, progress]);

  return (
    <PreloadContext.Provider value={value}>
      <AnimatePresence mode="wait">
        {!isReady ? (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Background ambient glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.05)_0%,_transparent_70%)]" />

            <div className="relative z-10">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 rounded-full border-t-2 border-emerald-500 border-r-2 border-transparent shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-black font-display text-emerald-400 tracking-tighter">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 text-center z-10"
            >
              <h3 className="text-[10px] font-black font-display text-white tracking-[0.4em] uppercase mb-2">
                Trinity Engine
              </h3>
              <div className="flex items-center gap-1.5 justify-center">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-mono text-emerald-500/60 uppercase tracking-widest">
                  Sincronizando Baralho
                </span>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </PreloadContext.Provider>
  );
}
