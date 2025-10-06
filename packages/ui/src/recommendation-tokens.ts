/**
 * Fashion Hub Recommendation Engine - Design Tokens
 * Soft pink accents, rounded-XL, subtle gradients, soft shadows, clean typography
 */

export const recommendationTokens = {
  // Color Tokens
  colors: {
    primary: {
      50: "#fdf2f8", // Lightest pink
      100: "#fce7f3",
      200: "#fbcfe8",
      300: "#f9a8d4",
      400: "#f472b6",
      500: "#ec4899", // Main pink
      600: "#db2777",
      700: "#be185d",
      800: "#9f1239",
      900: "#831843",
    },
    neutral: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#e5e5e5",
      300: "#d4d4d4",
      400: "#a3a3a3",
      500: "#737373",
      600: "#525252",
      700: "#404040",
      800: "#262626",
      900: "#171717",
    },
    gradient: {
      pink: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
      pinkToWhite: "linear-gradient(180deg, #fdf2f8 0%, #ffffff 100%)",
      subtle: "linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)",
      shimmer:
        "linear-gradient(90deg, transparent 0%, rgba(236, 72, 153, 0.1) 50%, transparent 100%)",
    },
    semantic: {
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
    },
  },

  // Border Radius Tokens
  radii: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "0.75rem", // 12px
    lg: "1rem", // 16px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px - Primary for cards
    "3xl": "2rem", // 32px
    full: "9999px", // Pills and circular elements
  },

  // Shadow Tokens
  shadows: {
    xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)",
    pink: "0 10px 20px -5px rgba(236, 72, 153, 0.2)",
    pinkSoft: "0 4px 12px -2px rgba(236, 72, 153, 0.15)",
  },

  // Typography Tokens
  typography: {
    fontFamily: {
      sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"SF Mono", "Menlo", "Monaco", "Courier New", monospace',
    },
    fontSize: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
      "5xl": "3rem", // 48px
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
    },
    lineHeight: {
      tight: "1.25",
      normal: "1.5",
      relaxed: "1.75",
    },
    letterSpacing: {
      tighter: "-0.05em",
      tight: "-0.025em",
      normal: "0",
      wide: "0.025em",
      wider: "0.05em",
    },
  },

  // Spacing Tokens
  spacing: {
    0: "0",
    1: "0.25rem", // 4px
    2: "0.5rem", // 8px
    3: "0.75rem", // 12px
    4: "1rem", // 16px
    5: "1.25rem", // 20px
    6: "1.5rem", // 24px
    8: "2rem", // 32px
    10: "2.5rem", // 40px
    12: "3rem", // 48px
    16: "4rem", // 64px
    20: "5rem", // 80px
  },

  // Animation Tokens
  animations: {
    duration: {
      fast: "150ms",
      normal: "250ms",
      slow: "350ms",
    },
    easing: {
      default: "cubic-bezier(0.4, 0, 0.2, 1)",
      in: "cubic-bezier(0.4, 0, 1, 1)",
      out: "cubic-bezier(0, 0, 0.2, 1)",
      inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },

  // Accessibility Tokens
  accessibility: {
    minTouchTarget: "44px", // Mobile minimum touch target
    focusRing: {
      width: "2px",
      offset: "2px",
      color: "#ec4899",
    },
    contrast: {
      // AA compliant contrast ratios
      textOnLight: "#171717", // neutral-900
      textOnDark: "#fafafa", // neutral-50
      textOnPrimary: "#ffffff",
    },
  },

  // Z-Index Tokens
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 1200,
    popover: 1300,
    tooltip: 1400,
  },
} as const;

// Tailwind CSS Config Extension for Recommendation Components
export const recommendationTailwindExtend = {
  colors: {
    "rec-pink": recommendationTokens.colors.primary,
    "rec-neutral": recommendationTokens.colors.neutral,
  },
  borderRadius: {
    "rec-xs": recommendationTokens.radii.xs,
    "rec-sm": recommendationTokens.radii.sm,
    "rec-md": recommendationTokens.radii.md,
    "rec-lg": recommendationTokens.radii.lg,
    "rec-xl": recommendationTokens.radii.xl,
    "rec-2xl": recommendationTokens.radii["2xl"],
    "rec-3xl": recommendationTokens.radii["3xl"],
  },
  boxShadow: {
    "rec-xs": recommendationTokens.shadows.xs,
    "rec-sm": recommendationTokens.shadows.sm,
    "rec-md": recommendationTokens.shadows.md,
    "rec-lg": recommendationTokens.shadows.lg,
    "rec-xl": recommendationTokens.shadows.xl,
    "rec-pink": recommendationTokens.shadows.pink,
    "rec-pink-soft": recommendationTokens.shadows.pinkSoft,
  },
};

// Type exports for TypeScript
export type RecommendationColors = typeof recommendationTokens.colors;
export type RecommendationRadii = typeof recommendationTokens.radii;
export type RecommendationShadows = typeof recommendationTokens.shadows;
export type RecommendationTypography = typeof recommendationTokens.typography;
