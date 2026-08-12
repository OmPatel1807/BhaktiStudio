import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const Logo = ({ size = 'medium', layout = 'horizontal', showText = true }) => {
  const { isDark } = useTheme();

  // LOOP 19: ENLARGED LOGO EMBLEM & BRANDING DIMENSIONS
  // Icon/wordmark scale fluidly with clamp() so the logo never overlaps
  // neighboring header controls on narrow viewports, without ever dropping
  // the wordmark below a comfortably legible size.
  const dimensions = {
    small: { iconW: 'clamp(32px, 9vw, 42px)', iconH: 'clamp(24px, 6.75vw, 31.5px)', text: 'clamp(15px, 4vw, 20px)' },
    medium: { iconW: 'clamp(40px, 11vw, 56px)', iconH: 'clamp(30px, 8.25vw, 42px)', text: 'clamp(17px, 4.5vw, 26px)' },
    large: { iconW: 'clamp(60px, 16vw, 96px)', iconH: 'clamp(45px, 12vw, 72px)', text: 'clamp(20px, 6vw, 34px)' },
  }[size] || { iconW: 'clamp(40px, 11vw, 56px)', iconH: 'clamp(30px, 8.25vw, 42px)', text: 'clamp(17px, 4.5vw, 26px)' };

  const gradientId = `logoGrad_${Math.random().toString(36).substring(2, 7)}`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: layout === 'vertical' ? 'column' : 'row',
        alignItems: 'center',
        gap: layout === 'vertical' ? '14px' : 'clamp(8px, 3vw, 16px)',
        userSelect: 'none',
        cursor: 'pointer',
      }}
    >
      {/* Exact Custom Line-Art Emblem SVG: Meditation Figure + 4 Intricate Veined Leaves + Sparkles + Flourish Base */}
      <svg
        viewBox="0 0 200 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: dimensions.iconW,
          height: dimensions.iconH,
          flexShrink: 0,
          filter: isDark
            ? 'drop-shadow(0 0 14px rgba(56, 189, 248, 0.45))'
            : 'drop-shadow(0 3px 10px rgba(201, 122, 19, 0.3))',
          transition: 'all 0.3s ease',
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#7DD3FC' : '#C97A13'} />
            <stop offset="50%" stopColor={isDark ? '#38BDF8' : '#D97706'} />
            <stop offset="100%" stopColor={isDark ? '#0284C7' : '#B86A08'} />
          </linearGradient>
        </defs>

        {/* 1. Center Fluid Meditation Line-Art Figure */}
        {/* Head loop */}
        <path
          d="M 100 48 C 94 36, 94 24, 100 24 C 106 24, 106 36, 100 48 Z"
          stroke={`url(#${gradientId})`}
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Heart / Torso Infinity Loops */}
        <path
          d="M 100 48 C 85 35, 75 55, 100 70 C 125 55, 115 35, 100 48 Z"
          stroke={`url(#${gradientId})`}
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Lotus Seated Legs Base */}
        <path
          d="M 75 72 C 60 70, 70 88, 100 88 C 130 88, 140 70, 125 72 C 110 74, 90 74, 75 72 Z"
          stroke={`url(#${gradientId})`}
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* 2. Four Symmetrical Leaf Motifs with Detailed Vein Lines */}
        {/* Upper Left Leaf */}
        <g stroke={`url(#${gradientId})`} strokeWidth="2.5" strokeLinecap="round">
          <path d="M 82 25 C 75 10, 60 15, 68 35 C 75 42, 85 35, 82 25 Z" fill="none" />
          <path d="M 75 30 L 71 18" strokeWidth="2" />
          <path d="M 73 26 L 68 24" strokeWidth="1.5" />
          <path d="M 75 28 L 72 32" strokeWidth="1.5" />
        </g>

        {/* Upper Right Leaf */}
        <g stroke={`url(#${gradientId})`} strokeWidth="2.5" strokeLinecap="round">
          <path d="M 118 25 C 125 10, 140 15, 132 35 C 125 42, 115 35, 118 25 Z" fill="none" />
          <path d="M 125 30 L 129 18" strokeWidth="2" />
          <path d="M 127 26 L 132 24" strokeWidth="1.5" />
          <path d="M 125 28 L 128 32" strokeWidth="1.5" />
        </g>

        {/* Lower Left Outer Leaf */}
        <g stroke={`url(#${gradientId})`} strokeWidth="2.5" strokeLinecap="round">
          <path d="M 60 45 C 45 35, 38 48, 48 65 C 58 70, 68 58, 60 45 Z" fill="none" />
          <path d="M 52 54 L 44 43" strokeWidth="2" />
          <path d="M 50 50 L 44 51" strokeWidth="1.5" />
          <path d="M 52 52 L 53 58" strokeWidth="1.5" />
        </g>

        {/* Lower Right Outer Leaf */}
        <g stroke={`url(#${gradientId})`} strokeWidth="2.5" strokeLinecap="round">
          <path d="M 140 45 C 155 35, 162 48, 152 65 C 142 70, 132 58, 140 45 Z" fill="none" />
          <path d="M 148 54 L 156 43" strokeWidth="2" />
          <path d="M 150 50 L 156 51" strokeWidth="1.5" />
          <path d="M 148 52 L 147 58" strokeWidth="1.5" />
        </g>

        {/* 3. Flourishing Swirling Ribbon Base */}
        <path
          d="M 35 90 C 25 80, 45 98, 75 96 C 100 94, 125 96, 165 90 C 175 80, 155 98, 125 96 C 100 98, 75 96, 35 90 Z"
          stroke={`url(#${gradientId})`}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M 100 95 L 100 106"
          stroke={`url(#${gradientId})`}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* 4. Diamond / Star Sparkle Highlights */}
        <path d="M 90 20 L 92 24 L 96 26 L 92 28 L 90 32 L 88 28 L 84 26 L 88 24 Z" fill={`url(#${gradientId})`} />
        <path d="M 110 20 L 112 24 L 116 26 L 112 28 L 110 32 L 108 28 L 104 26 L 108 24 Z" fill={`url(#${gradientId})`} />
        <path d="M 68 45 L 70 48 L 74 50 L 70 52 L 68 55 L 66 52 L 62 50 L 66 48 Z" fill={`url(#${gradientId})`} />
        <path d="M 132 45 L 134 48 L 138 50 L 134 52 L 132 55 L 130 52 L 126 50 L 130 48 Z" fill={`url(#${gradientId})`} />
      </svg>

      {/* LOOP 19: PROMINENT & BOLD TYPOGRAPHY (26PX FONT-BLACK) */}
      {showText && (
        <span
          style={{
            fontSize: dimensions.text,
            fontWeight: '900',
            letterSpacing: '3px',
            color: 'var(--text-primary)',
            fontFamily: 'Inter, system-ui, sans-serif',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}
        >
          BHAKTI <span style={{ color: isDark ? '#38BDF8' : '#C97A13', fontWeight: '900' }}>STUDIO</span>
        </span>
      )}
    </div>
  );
};
