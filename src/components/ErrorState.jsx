import { Box, Typography, Button, Alert } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

/**
 * Componente per visualizzare uno stato di errore con opzione di retry
 * @param {Object} props
 * @param {string} props.title - Titolo dell'errore
 * @param {string} props.message - Messaggio di errore dettagliato
 * @param {Function} props.onRetry - Callback per il pulsante di retry
 * @returns {JSX.Element}
 */
export default function ErrorState({ title = "Si è verificato un errore", message, onRetry }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "300px",
        p: 3,
        textAlign: "center",
      }}
      role="alert"
      aria-live="assertive"
    >
      <ErrorOutlineIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} aria-hidden="true" />

      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>

      {message && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 400 }}>
          {message}
        </Alert>
      )}

      {onRetry && (
        <Button variant="contained" onClick={onRetry} aria-label="Riprova l'operazione">
          Riprova
        </Button>
      )}
    </Box>
  );
}
