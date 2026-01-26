import { Box, CircularProgress, Typography } from "@mui/material";

/**
 * Componente per visualizzare uno stato di caricamento
 * @param {Object} props
 * @param {string} props.message - Messaggio da visualizzare durante il caricamento
 * @returns {JSX.Element}
 */
export default function LoadingState({ message = "Caricamento..." }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "200px",
        gap: 2,
      }}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <CircularProgress aria-label="Caricamento in corso" />
      <Typography variant="body2" color="textSecondary">
        {message}
      </Typography>
    </Box>
  );
}
