"use client";

import { useState, useEffect, createContext, useContext } from "react";

const ASSETS_TO_PRELOAD = [
  "/cards/card_1.webp",
  "/cards/card_2.webp",
  "/cards/card_3.webp",
  "/cards/card_4.webp",
  "/cards/card_5.webp",
  "/cards/card_6.webp",
  "/cards/card_7.webp",
  "/cards/card_8.webp",
  "/cards/card_9.webp",
  "/cards/card_10.webp",
  "/cards/card_11.webp",
  "/cards/card_12.webp",
  "/cards/trio_back_card.webp",
  // Add other critical assets here
];

interface PreloadContextType {
  isReady: boolean;
  progress: number;
}

const PreloadContext = createContext<PreloadContextType>({ isReady: false, progress: 0 });

export const usePreloader = () => useContext(PreloadContext);

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
          setIsReady(true);
        }
      }
    };

    assets.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = onLoad;
      img.onerror = onLoad; // Count as loaded even if error to avoid blocking
    });

    return () => {
      mounted = false;
    };
  }, []);

  const progress = ASSETS_TO_PRELOAD.length > 0 
    ? (loadedCount / ASSETS_TO_PRELOAD.length) * 100 
    : 100;

  return (
    <PreloadContext.Provider value={{ isReady, progress }}>
      {children}
    </PreloadContext.Provider>
  );
}
