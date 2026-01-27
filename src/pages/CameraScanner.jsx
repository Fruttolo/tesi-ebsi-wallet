import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarcodeScanner } from "@capacitor-community/barcode-scanner";
import { Container, Box, Typography, IconButton, Alert, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FlashlightOnIcon from "@mui/icons-material/FlashlightOn";
import FlashlightOffIcon from "@mui/icons-material/FlashlightOff";
import PageBase from "../components/PageBase";

/**
 * Pagina dedicata alla scansione QR con fotocamera sempre visibile
 */
export default function CameraScanner() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [preparing, setPreparing] = useState(true);

  useEffect(() => {
    // Avvia la scansione automaticamente quando la pagina si carica
    startScanning();

    // Cleanup quando si esce dalla pagina
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setPreparing(true);
      setError("");

      // Richiedi permessi
      const status = await BarcodeScanner.checkPermission({ force: true });

      if (!status.granted) {
        setError("Permesso fotocamera necessario per la scansione");
        setPreparing(false);
        return;
      }

      // Prepara l'interfaccia
      document.body.classList.add("scanner-active");
      document.querySelector("body")?.style.setProperty("background", "transparent");

      // Nascondi lo sfondo per mostrare la fotocamera
      await BarcodeScanner.hideBackground();

      setScanning(true);
      setPreparing(false);

      // Avvia la scansione
      const result = await BarcodeScanner.startScan();

      if (result.hasContent) {
        handleScanResult(result.content);
      }
    } catch (err) {
      console.error("Errore scansione:", err);
      setError(err.message || "Errore durante la scansione");
      setPreparing(false);
      stopScanning();
    }
  };

  const stopScanning = async () => {
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

  const handleScanResult = (content) => {
    stopScanning();

    try {
      // Prova a parsare come JSON
      const data = JSON.parse(content);
      processScannedData(data);
    } catch (e) {
      // Se non è JSON, tratta come testo
      processScannedData({ raw: content, type: "text" });
    }
  };

  const processScannedData = (data) => {
    console.log("QR Code scansionato:", data);

    // Determina il tipo di QR code e naviga di conseguenza
    if (data.type === "verification-request") {
      navigate("/verification-request", { state: { request: data } });
    } else if (data.type === "credential-offer") {
      navigate("/add-credential", { state: { offer: data } });
    } else if (data.type === "selective-disclosure") {
      navigate("/selective-presentation", { state: { request: data } });
    } else {
      // Per QR generici, torna alla pagina scan con i dati
      navigate("/scan-qr", {
        state: {
          scannedData: data,
          success: true,
        },
      });
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

  const handleClose = async () => {
    await stopScanning();
    navigate("/scan-qr");
  };

  return (
    <PageBase title="" hideBackButton>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "transparent",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header con pulsante chiudi */}
        <Box
          sx={{
            position: "relative",
            zIndex: 1000,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(10px)",
            pl: 2,
            pr: 2,
            pt: 6,
            pb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" color="white" fontWeight={600}>
            {preparing ? "Caricamento..." : "Inquadra il QR Code"}
          </Typography>
          <IconButton onClick={handleClose} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Errore */}
        {error && (
          <Box sx={{ position: "relative", zIndex: 1000, p: 2 }}>
            <Alert severity="error" onClose={() => setError("")}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Loading */}
        {preparing && (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0, 0, 0, 0.5)",
            }}
          >
            <CircularProgress size={60} sx={{ color: "white" }} />
          </Box>
        )}

        {/* Area di scansione con riquadro guida */}
        {scanning && !preparing && (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* Riquadro di scansione */}
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
        )}

        {/* Footer con controlli */}
        {scanning && !preparing && (
          <Box
            sx={{
              position: "relative",
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
        )}
      </Box>
    </PageBase>
  );
}
