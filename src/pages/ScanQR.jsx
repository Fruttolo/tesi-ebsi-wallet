import { Container, Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import PageBase from "../components/PageBase";

/**
 * Pagina per la scansione di QR code
 * TODO: Implementare con @capacitor/barcode-scanner
 */
export default function ScanQR() {
  const navigate = useNavigate();

  return (
    <PageBase title="Scansiona QR">
      <Container maxWidth="sm" sx={{ py: 4, textAlign: "center" }}>
        <QrCodeScannerIcon sx={{ fontSize: 100, color: "primary.main", mb: 3 }} />
        <Typography variant="h4" gutterBottom>
          Scansiona QR Code
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Funzionalità in fase di implementazione
        </Typography>
        <Button variant="contained" onClick={() => navigate("/home")}>
          Torna alla Home
        </Button>
      </Container>
    </PageBase>
  );
}
