/**
 * Minimal Elegant Warm Studio Design System Tokens
 * Palette:
 *   Dark: Obsidian (#0F172A), Slate (#1E293B), Accent Gold (#C97A13)
 *   Light: Off-white Silk (#FAF9F6), Warm Linen Beige (#F4EFE6), Soft Charcoal (#2B2B2B), Warm Slate/Taupe (#66625D), Muted Warm Gold (#C39B5A)
 */
export const themeTokens = {
  colors: {
    dark: {
      background: '#0F172A',
      surface: '#1E293B',
      surfaceHover: '#334155',
      input: '#0F172A',
      border: '#334155',
      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
      accentGold: '#C97A13',
      accentGoldHover: '#A35E07',
    },
    light: {
      background: '#FAF9F6',       // Off-white Silk Canvas
      surface: '#F4EFE6',          // Warm Linen Beige Card Surface
      surfaceHover: '#EBE4D8',     // Hover Warm Beige
      input: '#EFEAE1',            // Soft Beige Input Background
      border: '#E6DFD5',           // Soft Warm Border Line
      textPrimary: '#2B2B2B',      // Soft Charcoal Dark Text
      textSecondary: '#66625D',    // Warm Slate / Taupe Text
      textMuted: '#8A847C',
      accentGold: '#C39B5A',       // Muted Warm Gold Accent
      accentGoldHover: '#B28A49',  // Warm Gold Hover
    },
    accent: {
      main: '#C39B5A',             // Muted Warm Gold Accent
      hover: '#B28A49',            // Rich Warm Gold Hover
      light: '#F5ECE0',            // Soft Amber Gold tint
      muted: 'rgba(195, 155, 90, 0.15)',
    },
    status: {
      success: '#059669',
      warning: '#D97706',
      danger: '#DC2626',
      info: '#0284C7',
    }
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  shadows: {
    glow: '0 0 20px rgba(195, 155, 90, 0.2)',
    card: '0 4px 12px -2px rgba(43, 43, 43, 0.05), 0 2px 4px -1px rgba(43, 43, 43, 0.03)',
  }
};
