import { useState } from "react";
import { Container, Typography, Box, Button, Paper, Alert, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import PageBase from "../components/PageBase";
import QRScanner from "../components/QRScanner";

/**
 * Pagina per la scansione di QR code
 * Gestisce richieste di verifica e presentazioni di credenziali
 */
export default function ScanQR() {
  const navigate = useNavigate();
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState("");
  const [scanSuccess, setScanSuccess] = useState(false);

  const handleScan = (data) => {
    console.log("QR Code scansionato:", data);
    setScannedData(data);
    setScanSuccess(true);
    setError("");

    // Determina il tipo di QR code e naviga di conseguenza
    if (data.type === "verification-request") {
      // Richiesta di verifica - naviga a pagina di approvazione
      navigate("/verification-request", { state: { request: data } });
    } else if (data.type === "credential-offer") {
      // Offerta di credenziale - naviga a pagina di ricezione
      navigate("/add-credential", { state: { offer: data } });
    } else if (data.type === "selective-disclosure") {
      // Richiesta di selective disclosure
      navigate("/selective-presentation", { state: { request: data } });
    } else if (data.raw) {
      // QR code generico - mostra il contenuto
      setScannedData({ type: "generic", content: data.raw });
    } else {
      // Formato sconosciuto
      setError("Formato QR code non riconosciuto");
      setScanSuccess(false);
    }
  };

  const handleError = (err) => {
    console.error("Errore scansione:", err);
    setError(err.message || "Errore durante la scansione");
    setScanSuccess(false);
  };

  const resetScan = () => {
    setScannedData(null);
    setError("");
    setScanSuccess(false);
  };

  return (
    <PageBase title="Scansiona QR">
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

        {/* QR Scanner Component */}
        <Box sx={{ mb: 3 }}>
          <QRScanner onScan={handleScan} onError={handleError} />
        </Box>

        {/* Success Message */}
        {scanSuccess && !error && (
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }} onClose={resetScan}>
            <Typography variant="body2" fontWeight={600}>
              QR Code scansionato con successo!
            </Typography>
            <Typography variant="caption">Reindirizzamento in corso...</Typography>
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
                Richieste di verifica identità o età
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

        {/* Security Info */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            background: "rgba(16, 185, 129, 0.05)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" fontWeight={600} gutterBottom color="success.main">
            🔒 Privacy e Sicurezza
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • Verifica sempre l'identità del richiedente
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • Condividi solo i dati strettamente necessari
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Le tue credenziali rimangono sul dispositivo
          </Typography>
        </Paper>

        {/* Pulsante torna alla home */}
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Button variant="outlined" onClick={() => navigate("/home")} fullWidth>
            Torna alla Home
          </Button>
        </Box>
      </Container>
    </PageBase>
  );
}
