'use client';

import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    accent: Palette['primary'];
  }
  interface PaletteOptions {
    accent: Palette['primary'];
  }
}

export const theme = createTheme({
  palette: {
    primary: { main: '#2563eb', light: '#3b82f6', dark: '#1d4ed8' },
    secondary: { main: '#0891b2', light: '#06b6d4', dark: '#0e7490' },
    accent: { main: '#7c3aed', light: '#8b5cf6', dark: '#6d28d9', contrastText: '#fff' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    success: { main: '#059669', light: '#10b981' },
    warning: { main: '#d97706', light: '#f59e0b' },
    error: { main: '#dc2626', light: '#ef4444' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700 },
    h2: { fontSize: '2rem', fontWeight: 600 },
    h3: { fontSize: '1.5rem', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: { styleOverrides: { root: { boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' } } },
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
  },
});

export const priorityColors = {
  low: { bg: '#dcfce7', color: '#166534' },
  medium: { bg: '#fef3c7', color: '#92400e' },
  high: { bg: '#fee2e2', color: '#991b1b' },
};

export const statusColors = {
  pending: { bg: '#f1f5f9', color: '#475569' },
  in_progress: { bg: '#dbeafe', color: '#1e40af' },
  done: { bg: '#dcfce7', color: '#166534' },
};