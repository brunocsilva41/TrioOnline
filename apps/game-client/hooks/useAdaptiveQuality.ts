import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';

/**
 * useAdaptiveQuality Hook (EC-004 Compliance)
 * 
 * Monitors frame rate to detect thermal throttling or hardware strain.
 * Automatically triggers graceful degradation when performance drops.
 */
export const useAdaptiveQuality = () => {
  const setThermalThrottled = useGameStore((state) => state.setThermalThrottled);
  const isThermalThrottled = useGameStore((state) => state.ux.isThermalThrottled);
  
  const frameCount = useRef(0);
  const lastTimestamp = useRef(performance.now());
  const fpsHistory = useRef<number[]>([]);
  const checkInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let animationFrameId: number;

    const updateFps = () => {
      frameCount.current++;
      animationFrameId = requestAnimationFrame(updateFps);
    };

    animationFrameId = requestAnimationFrame(updateFps);

    // Check performance every 1 second
    checkInterval.current = setInterval(() => {
      const now = performance.now();
      const elapsed = (now - lastTimestamp.current) / 1000; // seconds
      
      if (elapsed >= 1) {
        const fps = Math.round(frameCount.current / elapsed);
        
        // Update history (keep last 3 seconds)
        fpsHistory.current.push(fps);
        if (fpsHistory.current.length > 3) {
          fpsHistory.current.shift();
        }

        // Calculate moving average
        const avgFps = fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length;

        // If average FPS < 24 for 3 seconds, enable thermal throttling mitigation
        if (fpsHistory.current.length === 3 && avgFps < 24 && !isThermalThrottled) {
          console.warn(`[EC-004] Thermal Throttling detected (Avg FPS: ${avgFps}). Degrading quality...`);
          setThermalThrottled(true);
        }

        // Reset counters for next second
        frameCount.current = 0;
        lastTimestamp.current = now;
      }
    }, 1000);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, [isThermalThrottled, setThermalThrottled]);

  return { isThermalThrottled };
};
