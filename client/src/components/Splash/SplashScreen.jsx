import React, { useEffect, useState } from 'react';
import { Logo } from '../Common/Logo';

/**
 * Animated Launch Splash Screen for Bhakti Studio
 * Features Obsidian Gold branding, tagline sequence, and prefers-reduced-motion check.
 */
export const SplashScreen = ({ onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Skip animations immediately
      onComplete?.();
      return;
    }

    const t1 = setTimeout(() => setStage(1), 400);  // Logo fade in
    const t2 = setTimeout(() => setStage(2), 1200); // Tagline reveal
    const t3 = setTimeout(() => setStage(3), 2200); // Fade out to login
    const t4 = setTimeout(() => onComplete?.(), 2700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div
      aria-label="Bhakti Studio Splash Screen"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#0F172A', // Obsidian Dark
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: stage === 3 ? 0 : 1,
        transition: 'opacity 0.5s ease-out',
        color: '#F8FAFC',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Background Subtle Gradient Glow */}
      <div
        style={{
          position: 'absolute',
          width: 'min(350px, calc(100vw - 32px))',
          height: 'min(350px, calc(100vw - 32px))',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, rgba(15,23,42,0) 70%)',
          transform: stage >= 1 ? 'scale(1.2)' : 'scale(0.8)',
          transition: 'transform 1s ease-out',
        }}
      />

      {/* Custom Vector Line-Art Emblem Logo */}
      <div
        style={{
          transform: stage >= 1 ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
          opacity: stage >= 1 ? 1 : 0,
          transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Logo size="large" layout="vertical" />

        {/* Subtitle Sequence */}
        <p
          style={{
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '3px',
            color: '#94A3B8',
            marginTop: '16px',
            opacity: stage >= 2 ? 1 : 0,
            transform: stage >= 2 ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.5s ease-out',
          }}
        >
          EVENT PRODUCTION & LED RENTAL PLATFORM
        </p>
      </div>

      {/* Animated Loading Dots */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          display: 'flex',
          gap: '6px',
          opacity: stage >= 1 ? 0.6 : 0,
          transition: 'opacity 0.5s ease',
        }}
      >
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38BDF8' }} />
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38BDF8' }} />
      </div>
    </div>
  );
};
