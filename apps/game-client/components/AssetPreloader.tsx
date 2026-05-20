"use client";

import { useState, useEffect, createContext, useContext, useMemo } from "react";
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
      {children}
    </PreloadContext.Provider>
  );
}
