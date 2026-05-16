import { Variants, Transition } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';

/**
 * PROJECT TRINITY - Card Animation Variants
 * 
 * DOC-ID: [11_A_FRAMER_MOTION_VARIANTS]
 * COMPLIANCE: [11_A]
 * 
 * Rigorous catalog of Framer Motion variants for the visual life cycle of cards.
 * Uses spring physics for 'juiciness' and high-performance GPU transforms.
 */

const FALLBACK_TRANSITION: Transition = { 
  type: "tween", 
  duration: 0.1 
};

export const cardVariants: Variants = {
  hidden_deck: { 
    scale: 0.8, 
    opacity: 0, 
    y: -200, 
    rotateY: 180 
  },
  hidden_table: { 
    scale: 1, 
    opacity: 1, 
    y: 0, 
    rotateY: 180, 
    transition: { 
      type: "spring", 
      stiffness: 200, 
      damping: 20 
    } 
  },
  hidden_hand_self: { 
    scale: 1, 
    opacity: 1, 
    y: 0, 
    rotateY: 0, 
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 25 
    } 
  },
  tension_shake: { 
    x: [0, -5, 5, -5, 5, 0], 
    transition: { 
      duration: 0.35, 
      repeat: Infinity 
    } 
  },
  revealed_table: { 
    rotateY: 0, 
    scale: 1.1, 
    zIndex: 10, 
    boxShadow: "0px 10px 30px rgba(0,255,255,0.4)",
    transition: { 
      type: "spring", 
      stiffness: 260, 
      damping: 20, 
      mass: 1.2 
    }
  },
  trio_fusion: {
    x: "50vw", 
    y: "50vh", 
    scale: 0.2, 
    opacity: 0, 
    rotateZ: 720,
    transition: { 
      duration: 0.6, 
      ease: "backIn" 
    }
  },
  fail_thud: {
    rotateY: 180, 
    scale: 1, 
    zIndex: 1, 
    y: [0, 20, 0],
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 10 
    }
  }
};

/**
 * useCardAnimations Hook
 * 
 * Provides consistent access to card variants and calculates the active
 * variant based on the card's state flags.
 * 
 * COMPLIANCE [EC-004]: Applies fast tween fallbacks when isThermalThrottled.
 */
export const useCardAnimations = (
  isRevealed: boolean, 
  isTrioMember: boolean, 
  isFailedReveal: boolean = false
) => {
  const isThermalThrottled = useGameStore(state => state.ux.isThermalThrottled);
  
  let activeVariant = "hidden_table";

  if (isTrioMember) {
    activeVariant = "trio_fusion";
  } else if (isFailedReveal) {
    activeVariant = "fail_thud";
  } else if (isRevealed) {
    activeVariant = "revealed_table";
  }

  // EC-004: If thermal throttled, override spring transitions with fast tweens
  const variants = isThermalThrottled 
    ? Object.keys(cardVariants).reduce((acc, key) => {
        const variant = cardVariants[key];
        acc[key] = {
          ...variant,
          transition: (variant as any).transition?.type === "spring" 
            ? FALLBACK_TRANSITION 
            : (variant as any).transition
        };
        return acc;
      }, {} as Variants)
    : cardVariants;

  return {
    variants,
    activeVariant
  };
};
