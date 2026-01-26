import { useState, useEffect } from "react";
import { BarcodeScanner } from "@capacitor-community/barcode-scanner";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Alert,
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CloseIcon from "@mui/icons-material/Close";
import FlashlightOnIcon from "@mui/icons-material/FlashlightOn";
import FlashlightOffIcon from "@mui/icons-material/FlashlightOff";

/**
 * Componente per la scansione di QR code
 * Utilizza @capacitor-community/barcode-scanner per funzionalità native
 *
 * @param {Object} props
 * @param {Function} props.onScan - Callback chiamato con i dati scansionati
 * @param {Function} props.onError - Callback opzionale per gestire errori
 * @param {boolean} props.fullScreenButton - Se true mostra pulsante, altrimenti solo funzioni
 */
export default function QRScanner({ onScan, onError, fullScreenButton = true }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [hasPermission, setHasPermission] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [preparing, setPreparing] = useState(false);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (scanning) {
        stopScan();
      }
    };
  }, [scanning]);

  const checkPermission = async () => {
    try {
      const status = await BarcodeScanner.checkPermission({ force: false });
      setHasPermission(status.granted);
      return status.granted;
    } catch (err) {
      console.error("Errore verifica permessi:", err);
      return false;
    }
  };

  const requestPermission = async () => {
    try {
      const status = await BarcodeScanner.checkPermission({ force: true });
      setHasPermission(status.granted);

      if (!status.granted) {
        const message = "Permesso fotocamera richiesto per la scansione QR";
        setError(message);
        if (onError) onError(new Error(message));
        return false;
      }

      return true;
    } catch (err) {
      const message = "Errore richiesta permessi fotocamera";
      setError(message);
      if (onError) onError(err);
      return false;
    }
  };

  const startScan = async () => {
    try {
      setPreparing(true);
      setError("");

      // Check and request permission if needed
      const granted = hasPermission ? true : await requestPermission();

      if (!granted) {
        setPreparing(false);
        return;
      }

      setScanning(true);
      setPreparing(false);

      // Prepare UI for scanning
      document.body.classList.add("scanner-active");
      document.querySelector("body")?.style.setProperty("background", "transparent");

      // Hide background to show camera
      await BarcodeScanner.hideBackground();

      // Start scanning
      const result = await BarcodeScanner.startScan();

      if (result.hasContent) {
        try {
          // Try to parse as JSON first
          const data = JSON.parse(result.content);
          onScan(data);
        } catch (e) {
          // If not JSON, return raw content
          onScan({ raw: result.content, type: "text" });
        }
      }
    } catch (err) {
      console.error("Errore scansione:", err);
      const message = err.message || "Errore durante la scansione";
      setError(message);
      if (onError) onError(err);
    } finally {
      setPreparing(false);
      stopScan();
    }
  };

  const stopScan = async () => {
    try {
      await BarcodeScanner.showBackground();
      await BarcodeScanner.stopScan();

      document.body.classList.remove("scanner-active");
      document.querySelector("body")?.style.removeProperty("background");

      setScanning(false);
      setTorchOn(false);
    } catch (err) {
      console.error("Errore stop scansione:", err);
    }
  };

  const toggleTorch = async () => {
    try {
      await BarcodeScanner.toggleTorch();
      setTorchOn(!torchOn);
    } catch (err) {
      console.error("Errore toggle torcia:", err);
    }
  };

  // Funzione esposta per avviare la scansione dall'esterno
  QRScanner.startScan = startScan;

  if (!fullScreenButton) {
    return null;
  }

  return (
    <>
      <Button
        variant="contained"
        size="large"
        fullWidth
        startIcon={
          preparing ? <CircularProgress size={20} color="inherit" /> : <QrCodeScannerIcon />
        }
        onClick={startScan}
        disabled={scanning || preparing}
        sx={{
          py: 1.5,
          fontSize: "1.1rem",
          fontWeight: 600,
        }}
      >
        {preparing ? "Preparazione..." : scanning ? "Scansione in corso..." : "Scansiona QR Code"}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Full screen scanner overlay */}
      <Dialog
        open={scanning}
        onClose={stopScan}
        fullScreen
        PaperProps={{
          sx: {
            background: "transparent",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "transparent",
          }}
        >
          {/* Header con titolo e pulsante chiudi */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(10px)",
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" color="white" fontWeight={600}>
              Inquadra il QR Code
            </Typography>
            <IconButton onClick={stopScan} sx={{ color: "white" }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Scanner area con overlay visivo */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* Guida visiva - rettangolo di scansione */}
            <Box
              sx={{
                width: "80%",
                maxWidth: "300px",
                aspectRatio: "1",
                border: "3px solid white",
                borderRadius: "16px",
                position: "relative",
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
                "&::before, &::after": {
                  content: '""',
                  position: "absolute",
                  width: "20px",
                  height: "20px",
                  border: "4px solid #60a5fa",
                },
                "&::before": {
                  top: -2,
                  left: -2,
                  borderRight: "none",
                  borderBottom: "none",
                },
                "&::after": {
                  bottom: -2,
                  right: -2,
                  borderLeft: "none",
                  borderTop: "none",
                },
              }}
            >
              {/* Corner indicators aggiuntivi */}
              <Box
                sx={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: "20px",
                  height: "20px",
                  borderTop: "4px solid #60a5fa",
                  borderRight: "4px solid #60a5fa",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: -2,
                  left: -2,
                  width: "20px",
                  height: "20px",
                  borderBottom: "4px solid #60a5fa",
                  borderLeft: "4px solid #60a5fa",
                }}
              />
            </Box>
          </Box>

          {/* Footer con controlli */}
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(10px)",
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography variant="body2" color="white" textAlign="center">
              Posiziona il QR code all'interno del riquadro
            </Typography>

            {/* Pulsante torcia */}
            <IconButton
              onClick={toggleTorch}
              sx={{
                bgcolor: torchOn ? "primary.main" : "rgba(255, 255, 255, 0.2)",
                color: "white",
                "&:hover": {
                  bgcolor: torchOn ? "primary.dark" : "rgba(255, 255, 255, 0.3)",
                },
              }}
            >
              {torchOn ? <FlashlightOnIcon /> : <FlashlightOffIcon />}
            </IconButton>
          </Box>
        </Box>
      </Dialog>
    </>
  );
}
