import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';

/**
 * PROJECT TRINITY - TrioFormation VFX
 * 
 * DOC-ID: [EC-004_MOBILE_THERMAL_THROTTLING]
 * COMPLIANCE: [EC-004]
 * 
 * High-impact visual effect for Trio formation.
 * Implements "Juiciness" through particle bursts and spring-like scales.
 * Features adaptive degradation for thermal throttling (fewer particles, no blurs).
 */

interface TrioExplosionProps {
  isVisible: boolean;
  color?: string;
  isThermalThrottled?: boolean;
}

const TrioExplosion: React.FC<TrioExplosionProps> = ({ 
  isVisible, 
  color = "#00ffff", 
  isThermalThrottled: propIsThermalThrottled
}) => {
  const storeIsThermalThrottled = useGameStore(state => state.ux.isThermalThrottled);
  const isThermalThrottled = propIsThermalThrottled ?? storeIsThermalThrottled;

  // Optimization: Reduce particle count and complexity if throttled (EC-004 Compliance)
  const particleCount = isThermalThrottled ? 8 : 24;
  
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      angle: (i / particleCount) * Math.PI * 2,
      distance: 100 + Math.random() * 150,
      size: 4 + Math.random() * 8,
      duration: 0.6 + Math.random() * 0.4,
      delay: Math.random() * 0.1
    }));
  }, [particleCount]);

  return (
    <div 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        zIndex: 50
      }}
    >
      <AnimatePresence>
        {isVisible && (
          <div style={{ position: 'relative' }}>
            {/* Center Flash - Disabled when throttled for performance */}
            {!isThermalThrottled && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 6, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{
                  position: 'absolute',
                  width: 40,
                  height: 40,
                  left: -20,
                  top: -20,
                  borderRadius: '50%',
                  backgroundColor: color,
                  filter: "blur(15px)",
                  boxShadow: `0 0 30px ${color}`
                }}
              />
            )}

            {/* Particles Burst */}
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{ 
                  x: Math.cos(p.angle) * p.distance,
                  y: Math.sin(p.angle) * p.distance,
                  scale: 0,
                  opacity: 0
                }}
                transition={{ 
                  duration: p.duration, 
                  delay: p.delay,
                  ease: [0.1, 0.5, 0.3, 1] // Custom "pop" ease
                }}
                style={{ 
                  position: 'absolute',
                  width: p.size, 
                  height: p.size, 
                  left: -p.size / 2,
                  top: -p.size / 2,
                  borderRadius: '2px', // Squared particles for 'tech' look
                  backgroundColor: color,
                  boxShadow: isThermalThrottled ? "none" : `0 0 10px ${color}`,
                  transform: `rotate(${p.angle}rad)`
                }}
              />
            ))}

            {/* Subtle radial shockwave */}
            {!isThermalThrottled && (
              <motion.div
                initial={{ scale: 0, opacity: 0.5, border: `2px solid ${color}` }}
                animate={{ scale: 8, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{
                  position: 'absolute',
                  width: 100,
                  height: 100,
                  left: -50,
                  top: -50,
                  borderRadius: '50%',
                }}
              />
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrioExplosion;
