import { Snackbar, Alert } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

/**
 * Snackbar per feedback di successo
 * @param {Object} props
 * @param {boolean} props.open - Stato di apertura dello snackbar
 * @param {string} props.message - Messaggio di successo
 * @param {Function} props.onClose - Callback per la chiusura
 * @returns {JSX.Element}
 */
export default function SuccessSnackbar({ open, message, onClose }) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert
        onClose={onClose}
        severity="success"
        icon={<CheckCircleIcon />}
        sx={{ width: "100%" }}
        role="status"
        aria-live="polite"
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
