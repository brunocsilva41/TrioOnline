"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tutorialSteps, TutorialStep } from './tutorialSteps';

/**
 * PROJECT TRINITY - TutorialOverlay Component
 * 
 * An interactive, step-by-step onboarding guide.
 * Uses Framer Motion for high-fidelity animations and spotlights.
 * 
 * REQ: Orientar o jogador a clicar em uma carta da mesa e depois na mão de um oponente.
 */
export const TutorialOverlay: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const currentStep = tutorialSteps[currentStepIndex];

  const updateHighlight = useCallback(() => {
    if (currentStep?.target) {
      const element = document.querySelector(currentStep.target);
      if (element) {
        setHighlightRect(element.getBoundingClientRect());
      } else {
        setHighlightRect(null);
      }
    } else {
      setHighlightRect(null);
    }
  }, [currentStep]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    return () => window.removeEventListener('resize', updateHighlight);
  }, [updateHighlight]);

  const handleNext = () => {
    if (currentStepIndex < tutorialSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsVisible(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // If the step requires a click on a target, we check if the click was inside the highlight
    if (currentStep.actionRequired === 'click' && highlightRect) {
      const { clientX, clientY } = e;
      if (
        clientX >= highlightRect.left &&
        clientX <= highlightRect.right &&
        clientY >= highlightRect.top &&
        clientY <= highlightRect.bottom
      ) {
        // User clicked the target, advance tutorial
        handleNext();
      }
    }
  };

  if (!isVisible || !mounted) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto overflow-hidden">
      {/* Dimmed Background with SVG Spotlight Hole */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {highlightRect && (
              <motion.rect
                initial={false}
                animate={{
                  x: highlightRect.left - 8,
                  y: highlightRect.top - 8,
                  width: highlightRect.width + 16,
                  height: highlightRect.height + 16,
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                rx="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.8)"
          mask="url(#spotlight-mask)"
          className="backdrop-blur-[2px]"
        />
      </svg>

      {/* Interactive Overlay Layer */}
      <div 
        className="absolute inset-0 cursor-default"
        onClick={handleOverlayClick}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`
              absolute flex flex-col items-center justify-center p-8 text-center
              ${highlightRect 
                ? (highlightRect.top > (typeof window !== 'undefined' ? window.innerHeight : 0) / 2 
                    ? 'bottom-[60%] left-1/2 -translate-x-1/2' 
                    : 'top-[60%] left-1/2 -translate-x-1/2')
                : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'}
            `}
          >
            <div className="max-w-md bg-[#1a1a1a] border border-white/10 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-xl">
              <span className="text-[10px] font-black tracking-[0.4em] text-emerald-400 uppercase mb-4 block">
                TUTORIAL // PHASE {currentStepIndex + 1}
              </span>
              <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">
                {currentStep.title}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                {currentStep.description}
              </p>

              {currentStep.actionRequired !== 'click' ? (
                <button
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="px-8 py-3 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full hover:bg-emerald-400 transition-colors duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  {currentStepIndex === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
                </button>
              ) : (
                <div className="flex items-center justify-center gap-3">
                   <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                   <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                     Action Required: Click the highlighted area
                   </span>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dynamic Highlight Border */}
        {highlightRect && (
          <motion.div
            initial={false}
            animate={{
              x: highlightRect.left - 8,
              y: highlightRect.top - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute border-2 border-emerald-400 rounded-2xl pointer-events-none shadow-[0_0_30px_rgba(52,211,153,0.3)]"
          >
             <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
             <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
             <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
             <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
          </motion.div>
        )}
      </div>
    </div>
  );
};
