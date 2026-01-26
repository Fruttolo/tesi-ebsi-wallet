import { Box, CircularProgress, Typography } from "@mui/material";

/**
 * Loading screen mobile-optimized
 * Mostrato durante inizializzazione app
 */
export default function LoadingScreen({ message = "Caricamento..." }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
        px: 3,
      }}
    >
      <CircularProgress size={60} thickness={4} sx={{ mb: 3, color: "primary.main" }} />
      <Typography variant="h6" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}
