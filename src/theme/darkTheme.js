import { createTheme } from "@mui/material/styles";

/**
 * Tema dark ottimizzato per mobile
 */
export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#60a5fa",
      light: "#93c5fd",
      dark: "#3b82f6",
    },
    secondary: {
      main: "#f48fb1",
      light: "#ffc1e3",
      dark: "#c2185b",
    },
    background: {
      default: "#0f172a",
      paper: "#1e293b",
    },
    error: {
      main: "#ef4444",
    },
    warning: {
      main: "#f59e0b",
    },
    success: {
      main: "#10b981",
    },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    // Font sizes ottimizzate per mobile
    h1: {
      fontSize: "2rem",
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "1.75rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.125rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
    },
    button: {
      fontSize: "1rem",
      fontWeight: 600,
      textTransform: "none",
    },
  },
  components: {
    // Touch-friendly button sizes
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 48,
          padding: "12px 24px",
          borderRadius: 12,
        },
        sizeLarge: {
          minHeight: 56,
          padding: "16px 32px",
          fontSize: "1.125rem",
        },
      },
    },
    // Touch-friendly icon buttons
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 48,
          minHeight: 48,
          padding: 12,
        },
      },
    },
    // Card ottimizzate per mobile
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
        },
      },
    },
    // Input touch-friendly
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputBase-root": {
            minHeight: 48,
          },
        },
      },
    },
    // List items touch-friendly
    MuiListItem: {
      styleOverrides: {
        root: {
          minHeight: 56,
          paddingTop: 12,
          paddingBottom: 12,
        },
      },
    },
    // Chip sizing
    MuiChip: {
      styleOverrides: {
        root: {
          height: 36,
          fontSize: "0.875rem",
        },
      },
    },
  },
  // Spacing ottimizzato per mobile
  spacing: 8,
});

/**
 * Tema light ottimizzato per mobile
 */
export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#3b82f6",
      light: "#60a5fa",
      dark: "#2563eb",
    },
    secondary: {
      main: "#ec4899",
      light: "#f472b6",
      dark: "#db2777",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    error: {
      main: "#ef4444",
    },
    warning: {
      main: "#f59e0b",
    },
    success: {
      main: "#10b981",
    },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    h1: {
      fontSize: "2rem",
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "1.75rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.125rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
    },
    button: {
      fontSize: "1rem",
      fontWeight: 600,
      textTransform: "none",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 48,
          padding: "12px 24px",
          borderRadius: 12,
        },
        sizeLarge: {
          minHeight: 56,
          padding: "16px 32px",
          fontSize: "1.125rem",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 48,
          minHeight: 48,
          padding: 12,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputBase-root": {
            minHeight: 48,
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          minHeight: 56,
          paddingTop: 12,
          paddingBottom: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: 36,
          fontSize: "0.875rem",
        },
      },
    },
  },
  spacing: 8,
});
