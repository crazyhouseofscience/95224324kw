import React, { useState, useEffect } from 'react';
import { SimulationState, SimulationParams } from '../types/simulation';

interface SparkFlashBannerProps {
  state: SimulationState;
  params: SimulationParams;
  onTriggerSpark?: () => void;
}

export const SparkFlashBanner: React.FC<SparkFlashBannerProps> = ({ state }) => {
  const [showFlash, setShowFlash] = useState(false);

  // Trigger subtle edge flash on spark discharge
  useEffect(() => {
    if (state.isSparking) {
      setShowFlash(true);
      const timer = setTimeout(() => {
        setShowFlash(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [state.isSparking]);

  if (!showFlash) return null;

  return (
    /* Subtle peripheral viewport flash only — zero floating banners covering apparatus */
    <div className="fixed inset-0 pointer-events-none z-50 ring-4 ring-amber-400/60 bg-amber-400/5 transition-opacity duration-200" />
  );
};
