import { useState } from "react";
import { BarcodeScanner } from "@capacitor-community/barcode-scanner";
import { Button, Dialog, DialogContent, DialogTitle, Alert } from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";

export default function QRScanner({ onScan }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  const startScan = async () => {
    try {
      // Check permission
      const status = await BarcodeScanner.checkPermission({ force: true });

      if (!status.granted) {
        setError("Camera permission required");
        return;
      }

      setScanning(true);
      setError("");

      // Hide background
      document.body.classList.add("scanner-active");
      BarcodeScanner.hideBackground();

      // Start scanning
      const result = await BarcodeScanner.startScan();

      if (result.hasContent) {
        try {
          // Parse QR code content
          const data = JSON.parse(result.content);
          onScan(data);
        } catch (e) {
          setError("Invalid QR code format");
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      stopScan();
    }
  };

  const stopScan = () => {
    BarcodeScanner.showBackground();
    BarcodeScanner.stopScan();
    document.body.classList.remove("scanner-active");
    setScanning(false);
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<QrCodeScannerIcon />}
        onClick={startScan}
        disabled={scanning}
      >
        Scan QR Code
      </Button>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Dialog open={scanning} onClose={stopScan} fullScreen>
        <DialogTitle>Scan QR Code</DialogTitle>
        <DialogContent>
          <Button onClick={stopScan} variant="outlined">
            Cancel
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
