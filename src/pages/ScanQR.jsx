import { useState, useEffect } from "react";
import { Container, Typography, Box, Button, Paper, Alert, Chip } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

/**
 * Pagina per la scansione di QR code
 * Gestisce richieste di verifica e presentazioni di credenziali
 */
export default function ScanQR() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState("");
  const [scanSuccess, setScanSuccess] = useState(false);

  // Gestisci dati ricevuti dalla pagina di scansione
  useEffect(() => {
    if (location.state?.scannedData) {
      setScannedData(location.state.scannedData);
      setScanSuccess(location.state.success || false);
    }
  }, [location.state]);

  const resetScan = () => {
    setScannedData(null);
    setError("");
    setScanSuccess(false);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      {/* Header con istruzioni */}
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <QrCodeScannerIcon
          sx={{
            fontSize: 80,
            color: "primary.main",
            mb: 2,
            filter: "drop-shadow(0 4px 6px rgba(96, 165, 250, 0.3))",
          }}
        />
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Scansiona QR Code
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Usa la fotocamera per scansionare QR code di verifica identità o offerte di credenziali
        </Typography>
      </Box>

      {/* Pulsante per avviare la scansione */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<QrCodeScannerIcon />}
          onClick={() => navigate("/camera-scanner")}
          sx={{
            py: 1.5,
            fontSize: "1.1rem",
            fontWeight: 600,
          }}
        >
          Avvia Scansione
        </Button>
      </Box>

      {/* Success Message */}
      {scanSuccess && scannedData && (
        <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }} onClose={resetScan}>
          <Typography variant="body2" fontWeight={600}>
            QR Code scansionato con successo!
          </Typography>
          {scannedData.raw && (
            <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
              Contenuto: {scannedData.raw.substring(0, 100)}
              {scannedData.raw.length > 100 ? "..." : ""}
            </Typography>
          )}
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }} onClose={resetScan}>
          {error}
        </Alert>
      )}

      {/* Info Cards - Tipologie supportate */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          background:
            "linear-gradient(135deg, rgba(96, 165, 250, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
          border: "1px solid rgba(96, 165, 250, 0.2)",
          borderRadius: 2,
          mb: 3,
        }}
      >
        <Typography variant="h6" fontWeight={600} gutterBottom>
          💡 Tipologie QR supportate
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip label="Verifica" size="small" color="primary" sx={{ minWidth: 100 }} />
            <Typography variant="body2" color="text.secondary">
              Richieste di verifica VC
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip label="Credenziale" size="small" color="success" sx={{ minWidth: 100 }} />
            <Typography variant="body2" color="text.secondary">
              Offerte di nuove credenziali verificabili
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip label="Selective" size="small" color="secondary" sx={{ minWidth: 100 }} />
            <Typography variant="body2" color="text.secondary">
              Richieste con selective disclosure
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
