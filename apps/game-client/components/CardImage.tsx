"use client";

import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  CARD_BACK_IMAGE_SRC,
  getCardImageSrc,
  isCardAssetLoaded,
  markCardAssetLoaded,
} from "../lib/cardAssets";
import { usePreloader } from "./AssetPreloader";

interface CardImageProps {
  value?: number;
  src?: string;
  alt?: string;
  className?: string;
  imageClassName?: string;
  eager?: boolean;
  label?: string;
}

/**
 * PROJECT TRINITY - Optimized Card Image Component
 * Handles preloading state, fallbacks, and smooth transitions.
 * Uses decoding="async" and fetchpriority="high" for performance.
 */
const CardImage = memo(function CardImage({
  value,
  src,
  alt = "",
  className = "",
  imageClassName = "",
  eager = true,
  label,
}: CardImageProps) {
  const { isReady } = usePreloader();
  const imageSrc = useMemo(() => src ?? getCardImageSrc(value), [src, value]);
  
  // Initialize 'loaded' state based on the global cache
  const [loaded, setLoaded] = useState(() => isCardAssetLoaded(imageSrc));
  const [error, setError] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  const isBack = imageSrc === CARD_BACK_IMAGE_SRC;
  const fallbackLabel = label ?? (isBack ? "TRIO" : String(value ?? ""));

  // Sync with global cache when imageSrc changes or preloader finishes
  useEffect(() => {
    if (isCardAssetLoaded(imageSrc)) {
      setLoaded(true);
    }
  }, [imageSrc, isReady]);

  // Check if image is already complete in DOM
  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0) {
      markCardAssetLoaded(imageSrc);
      setLoaded(true);
    }
  }, [imageSrc]);

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-[#1e293b] ${className}`}
    >
      {/* Card Border & Texture Overlay */}
      <div className="absolute inset-[7%] rounded-[inherit] border border-white/5 bg-white/5 pointer-events-none" />
      
      {/* Fallback Text (Visible while loading or on error) */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 ${loaded ? "opacity-0" : "opacity-100"}`}>
        <span className={`font-black tracking-[0.2em] text-white/20 ${isBack ? "text-[12px]" : "text-[18px]"}`}>
          {fallbackLabel}
        </span>
        {error && <span className="text-[6px] text-red-500/50 uppercase mt-1">Erro</span>}
      </div>

      <img
        ref={imageRef}
        src={imageSrc}
        alt={alt}
        decoding="async"
        loading={eager ? "eager" : "lazy"}
        // @ts-ignore - fetchPriority is supported in modern browsers
        fetchPriority={eager ? "high" : "auto"}
        draggable={false}
        onLoad={() => {
          markCardAssetLoaded(imageSrc);
          setLoaded(true);
          setError(false);
        }}
        onError={() => {
          setError(true);
          setLoaded(false);
        }}
        className={`absolute inset-0 h-full w-full select-none object-cover transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"} ${imageClassName}`}
      />
    </div>
  );
});

export default CardImage;
