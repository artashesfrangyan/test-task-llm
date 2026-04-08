'use client';

import { createTheme, alpha } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    accent: Palette['primary'];
  }
  interface PaletteOptions {
    accent: Palette['primary'];
  }
}

const primaryHue = 221;
const secondaryHue = 175;
const accentHue = 280;

export const theme = createTheme({
  palette: {
    primary: {
      main: `hsl(${primaryHue}, 83%, 53%)`,
      light: `hsl(${primaryHue}, 83%, 63%)`,
      dark: `hsl(${primaryHue}, 83%, 43%)`,
      contrastText: '#ffffff',
    },
    secondary: {
      main: `hsl(${secondaryHue}, 70%, 45%)`,
      light: `hsl(${secondaryHue}, 70%, 55%)`,
      dark: `hsl(${secondaryHue}, 70%, 35%)`,
      contrastText: '#ffffff',
    },
    accent: {
      main: `hsl(${accentHue}, 70%, 55%)`,
      light: `hsl(${accentHue}, 70%, 65%)`,
      dark: `hsl(${accentHue}, 70%, 45%)`,
      contrastText: '#ffffff',
    },
    background: {
      default: `hsl(${primaryHue}, 30%, 98%)`,
      paper: '#ffffff',
    },
    success: {
      main: `hsl(152, 70%, 35%)`,
      light: `hsl(152, 70%, 45%)`,
      dark: `hsl(152, 70%, 25%)`,
    },
    warning: {
      main: `hsl(38, 92%, 50%)`,
      light: `hsl(38, 92%, 60%)`,
      dark: `hsl(38, 92%, 40%)`,
    },
    error: {
      main: `hsl(0, 72%, 51%)`,
      light: `hsl(0, 72%, 61%)`,
      dark: `hsl(0, 72%, 41%)`,
    },
    text: {
      primary: `hsl(${primaryHue}, 25%, 15%)`,
      secondary: `hsl(${primaryHue}, 15%, 45%)`,
    },
    divider: `hsl(${primaryHue}, 20%, 90%)`,
  },
  typography: {
    fontFamily: '"Inter", "system-ui", "sans-serif"',
    h1: { fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontSize: '1.25rem', fontWeight: 600 },
    h5: { fontSize: '1.125rem', fontWeight: 600 },
    h6: { fontSize: '1rem', fontWeight: 600 },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  shadows: [
    'none',
    `0 1px 2px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.05)}`,
    `0 1px 3px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.1)}`,
    `0 4px 6px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.07)}`,
    `0 6px 12px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.1)}`,
    `0 8px 24px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.12)}`,
    `0 12px 32px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.14)}`,
    `0 16px 40px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.16)}`,
    `0 20px 48px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.18)}`,
    `0 24px 56px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.2)}`,
    `0 24px 56px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.2)}`,
    `0 24px 56px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.2)}`,
    `0 24px 56px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.2)}`,
    `0 24px 56px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.2)}`,
    `0 24px 56px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.2)}`,
    `0 24px 56px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.2)}`,
    `0 24px 56px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.2)}`,
    `0 24px 56px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.2)}`,
    `0 24px 56px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.2)}`,
    `0 24px 56px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.2)}`,
    `0 24px 56px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.2)}`,
    `0 24px 56px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.2)}`,
    `0 24px 56px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.2)}`,
    `0 24px 56px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.2)}`,
    `0 24px 56px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.2)}`,
  ] as const,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: `${alpha(`hsl(${primaryHue}, 50%, 50%)`, 0.3)} transparent`,
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 4,
            backgroundColor: alpha(`hsl(${primaryHue}, 50%, 50%)`, 0.3),
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: `0 1px 3px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.08)}`,
          border: `1px solid ${alpha(`hsl(${primaryHue}, 50%, 50%)`, 0.12)}`,
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          '&:hover': {
            boxShadow: `0 4px 12px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.12)}`,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          padding: '8px 20px',
        },
        contained: {
          boxShadow: `0 2px 4px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.15)}`,
          '&:hover': {
            boxShadow: `0 4px 8px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.2)}`,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 8,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: `0 24px 48px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.2)}`,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            '&:hover fieldset': {
              borderColor: `hsl(${primaryHue}, 83%, 53%)`,
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: `0 1px 3px ${alpha(`hsl(${primaryHue}, 50%, 10%)`, 0.08)}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.75rem',
        },
      },
    },
  },
});

export const priorityColors = {
  low: {
    bg: `hsl(152, 60%, 94%)`,
    color: `hsl(152, 70%, 25%)`,
    border: `hsl(152, 50%, 70%)`,
  },
  medium: {
    bg: `hsl(38, 90%, 94%)`,
    color: `hsl(38, 90%, 25%)`,
    border: `hsl(38, 80%, 65%)`,
  },
  high: {
    bg: `hsl(0, 70%, 94%)`,
    color: `hsl(0, 70%, 30%)`,
    border: `hsl(0, 60%, 65%)`,
  },
};

export const statusColors = {
  pending: {
    bg: `hsl(${primaryHue}, 20%, 95%)`,
    color: `hsl(${primaryHue}, 30%, 40%)`,
    border: `hsl(${primaryHue}, 20%, 75%)`,
  },
  in_progress: {
    bg: `hsl(${primaryHue}, 90%, 94%)`,
    color: `hsl(${primaryHue}, 80%, 35%)`,
    border: `hsl(${primaryHue}, 70%, 60%)`,
  },
  done: {
    bg: `hsl(152, 60%, 94%)`,
    color: `hsl(152, 70%, 25%)`,
    border: `hsl(152, 50%, 70%)`,
  },
};

export const categoryColors: Record<string, { bg: string; color: string }> = {
  bug: { bg: `hsl(0, 70%, 94%)`, color: `hsl(0, 70%, 30%)` },
  feature: { bg: `hsl(${accentHue}, 60%, 94%)`, color: `hsl(${accentHue}, 60%, 30%)` },
  improvement: { bg: `hsl(${secondaryHue}, 50%, 94%)`, color: `hsl(${secondaryHue}, 50%, 30%)` },
  documentation: { bg: `hsl(45, 60%, 94%)`, color: `hsl(45, 60%, 30%)` },
  research: { bg: `hsl(260, 50%, 94%)`, color: `hsl(260, 50%, 30%)` },
};