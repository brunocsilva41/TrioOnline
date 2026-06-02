"use client";

import Image from "next/image";
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
 * Now using next/image for LCP/FCP optimization.
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
  
  const [loaded, setLoaded] = useState(() => isCardAssetLoaded(imageSrc));
  const [error, setError] = useState(false);
  
  const isBack = imageSrc === CARD_BACK_IMAGE_SRC;
  const fallbackLabel = label ?? (isBack ? "TRIO" : String(value ?? ""));

  useEffect(() => {
    if (isCardAssetLoaded(imageSrc)) {
      setLoaded(true);
    }
  }, [imageSrc, isReady]);

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-[linear-gradient(145deg,#f7ecd2_0%,#d9b46a_48%,#7b3f16_100%)] ${className}`}
    >
      <div className="absolute inset-[7%] rounded-[inherit] border border-black/15 bg-black/5 pointer-events-none z-10" />
      
      <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 ${loaded ? "opacity-0" : "opacity-100"}`}>
        <span className={`font-black tracking-[0.2em] text-black/40 ${isBack ? "text-[12px]" : "text-[18px]"}`}>
          {fallbackLabel}
        </span>
        {error && <span className="text-[6px] text-red-500/50 uppercase mt-1">Load Error</span>}
      </div>

      <Image
        src={imageSrc}
        alt={alt}
        fill
        sizes="(max-width: 640px) 72px, (max-width: 1024px) 100px, 120px"
        priority={eager}
        quality={85}
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
        className={`select-none object-cover transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"} ${imageClassName}`}
      />
    </div>
  );
});

export default CardImage;
