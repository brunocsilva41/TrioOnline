export const CARD_FACE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export type CardFaceValue = (typeof CARD_FACE_VALUES)[number];

export const CARD_BACK_IMAGE_SRC = "/cards/trio_back_card.webp";

export const CARD_ASSET_PATHS = [
  ...CARD_FACE_VALUES.map((value) => `/cards/card_${value}.webp`),
  CARD_BACK_IMAGE_SRC,
] as const;

// Use a simple global set to track loaded assets
const loadedCardAssets = new Set<string>();

/**
 * PROJECT TRINITY - Card Assets Utility
 * Centralizes path management and preloading logic.
 */

export function isCardFaceValue(value: unknown): value is CardFaceValue {
  return Number.isInteger(value) && typeof value === "number" && value >= 1 && value <= 12;
}

export function getCardFaceImageSrc(value: CardFaceValue): string {
  return `/cards/card_${value}.webp`;
}

export function getCardImageSrc(value: unknown): string {
  return isCardFaceValue(value) ? getCardFaceImageSrc(value) : CARD_BACK_IMAGE_SRC;
}

export function markCardAssetLoaded(src: string) {
  if (!src) return;
  loadedCardAssets.add(src);
}

export function isCardAssetLoaded(src: string) {
  if (!src) return false;
  return loadedCardAssets.has(src);
}

/**
 * Preloads a single card asset and decodes it in the background.
 * This ensures the image is ready for immediate display without flickering.
 */
export async function preloadCardAsset(src: string): Promise<void> {
  if (typeof window === "undefined" || isCardAssetLoaded(src)) return;

  return new Promise<void>((resolve) => {
    const image = new window.Image();
    
    // Performance hints
    image.decoding = "async";
    
    const onComplete = async () => {
      try {
        if ("decode" in image && typeof image.decode === "function") {
          await image.decode();
        }
        markCardAssetLoaded(src);
      } catch (err) {
        // Fallback: even if decode fails, mark as loaded if onload fired
        markCardAssetLoaded(src);
      } finally {
        resolve();
      }
    };

    image.onload = onComplete;
    image.onerror = () => {
      console.warn(`Failed to preload asset: ${src}`);
      resolve(); // Still resolve to not block the preloader
    };
    
    image.src = src;

    // Check if already complete (e.g. from cache)
    if (image.complete) {
      void onComplete();
    }
  });
}

/**
 * Preloads all game assets.
 */
export async function preloadAllGameAssets() {
  await Promise.all(CARD_ASSET_PATHS.map(preloadCardAsset));
}
