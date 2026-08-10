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
    // Initialize Lenis smooth momentum scroll (Snappy & Responsive)
    const lenis = new Lenis({
      duration: 0.7, // Snappy & instant response without heavy sluggish delay
      easing: (t: number) => 1 - Math.pow(1 - t, 3.5), // Smooth cubic-exponential ease-out
      smoothWheel: true,
      wheelMultiplier: 1.15, // Effortless scroll distance per notch
      touchMultiplier: 1.8,
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
