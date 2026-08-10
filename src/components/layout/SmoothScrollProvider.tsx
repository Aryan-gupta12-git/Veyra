import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

export const SmoothScrollProvider: React.FC<SmoothScrollProviderProps> = ({ children }) => {
  const lenisRef = useRef<Lenis | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Initialize Lenis for programmatic scrolling, while allowing 100% fast native wheel/trackpad scroll (YouTube style)
    const lenis = new Lenis({
      duration: 0.15, // Lightning-fast 150ms interpolation for instant responsiveness
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      smoothWheel: false, // 100% native GPU-accelerated 0ms latency wheel scrolling like YouTube & Twitter
      syncTouch: false,
      infinite: false,
    });

    lenisRef.current = lenis;
    (window as any).lenisInstance = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
      delete (window as any).lenisInstance;
    };
  }, []);

  // When route location changes, resize Lenis to calculate new DOM scroll heights
  useEffect(() => {
    if (lenisRef.current) {
      setTimeout(() => {
        lenisRef.current?.resize();
      }, 50);
    }
  }, [location.pathname]);

  return <>{children}</>;
};

export default SmoothScrollProvider;
