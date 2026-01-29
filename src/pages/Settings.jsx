import { useState } from "react";
import {
  Stack,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SettingsIcon from "@mui/icons-material/Settings";
import BackupIcon from "@mui/icons-material/Backup";
import SecurityIcon from "@mui/icons-material/Security";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import InfoIcon from "@mui/icons-material/Info";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PageBase from "../components/PageBase";
import { clearDIDData } from "../storage/didStorage";
import { clearAllCredentials } from "../storage/credentialStorage";
import { clearAllSecure } from "../storage/secureStorage";
import { Preferences } from "@capacitor/preferences";

/**
 * Pagina impostazioni mobile-optimized
 * Lista touch-friendly con icone e feedback visivo
 */
export default function Settings() {
  const navigate = useNavigate();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  /**
   * Elimina tutti i dati del wallet e resetta l'app
   */
  const handleResetWallet = async () => {
    if (confirmText !== "ELIMINA") {
      setError("Devi digitare 'ELIMINA' per confermare");
      return;
    }

    setDeleting(true);
    setError("");

    try {
      // 1. Elimina DID e chiavi
      await clearDIDData();
      console.log("APP-EBSI: DID data cleared");

      // 2. Elimina tutte le credenziali
      await clearAllCredentials();
      console.log("APP-EBSI: Credentials cleared");

      // 3. Pulisci secure storage
      await clearAllSecure();
      console.log("APP-EBSI: Secure storage cleared");

      // 4. Pulisci Preferences
      await Preferences.clear();
      console.log("APP-EBSI: Preferences cleared");

      // 5. Pulisci localStorage (stato wallet inizializzato, ecc.)
      localStorage.clear();
      console.log("APP-EBSI: LocalStorage cleared");

      // 6. Reindirizza alla pagina iniziale
      navigate("/", { replace: true });
    } catch (err) {
      console.error("APP-EBSI: Error resetting wallet:", err);
      setError("Errore durante il reset del wallet: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const settingsItems = [
    {
      icon: BackupIcon,
      title: "Backup Seed Phrase",
      subtitle: "Visualizza e salva la tua seed phrase",
      color: "warning.main",
      onClick: () => console.log("APP-EBSI: Backup seed"),
    },
    {
      icon: SecurityIcon,
      title: "Sicurezza",
      subtitle: "PIN, biometria e opzioni di sicurezza",
      color: "error.main",
      onClick: () => console.log("APP-EBSI: Sicurezza"),
    },
    {
      icon: FingerprintIcon,
      title: "Gestione DID",
      subtitle: "Visualizza e gestisci il tuo DID",
      color: "primary.main",
      onClick: () => console.log("APP-EBSI: Gestione DID"),
      showDangerZone: true, // Mostra zona pericolosa sotto questo item
    },
    {
      icon: InfoIcon,
      title: "Info App",
      subtitle: "Versione e informazioni tecniche",
      color: "info.main",
      onClick: () => console.log("APP-EBSI: Info app"),
    },
  ];

  return (
    <PageBase title="Impostazioni">
      {/* Header icon */}
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Avatar
          sx={{
            width: 80,
            height: 80,
            margin: "0 auto",
            bgcolor: "transparent",
            border: "3px solid",
            borderColor: "primary.main",
          }}
        >
          <SettingsIcon sx={{ fontSize: 48, color: "primary.main" }} />
        </Avatar>
      </Box>

      {/* Settings list - touch friendly */}
      <Card
        sx={{
          background:
            "linear-gradient(135deg, rgba(96, 165, 250, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
          border: "1px solid rgba(96, 165, 250, 0.2)",
        }}
      >
        <List sx={{ p: 0 }}>
          {settingsItems.map((item, index) => (
            <Box key={item.title}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={item.onClick}
                  sx={{
                    py: 2,
                    px: 2.5,
                    "&:active": {
                      bgcolor: "action.selected",
                    },
                  }}
                >
                  <ListItemIcon>
                    <Avatar
                      sx={{
                        bgcolor: "transparent",
                        border: `2px solid ${item.color}`,
                        width: 44,
                        height: 44,
                      }}
                    >
                      <item.icon sx={{ color: item.color, fontSize: 24 }} />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight={600}>
                        {item.title}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {item.subtitle}
                      </Typography>
                    }
                    sx={{ ml: 1 }}
                  />
                  <ChevronRightIcon sx={{ color: "text.secondary" }} />
                </ListItemButton>
              </ListItem>

              {/* Danger Zone - Mostra dopo Gestione DID */}
              {item.showDangerZone && (
                <>
                  <Divider />
                  <Box sx={{ p: 2.5, bgcolor: "rgba(211, 47, 47, 0.03)" }}>
                    <Stack spacing={1.5}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <WarningAmberIcon sx={{ color: "error.main", fontSize: 20 }} />
                        <Typography variant="body2" fontWeight={600} color="error">
                          Zona Pericolosa
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Questa azione eliminerà permanentemente tutti i dati del wallet: DID, chiavi
                        private, credenziali e impostazioni. Operazione irreversibile.
                      </Typography>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteForeverIcon />}
                        onClick={() => setOpenDeleteDialog(true)}
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        Elimina Wallet e Reset
                      </Button>
                    </Stack>
                  </Box>
                </>
              )}

              {index < settingsItems.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </Card>

      {/* Info footer */}
      <Card
        sx={{
          mt: 3,
          bgcolor: "rgba(96, 165, 250, 0.05)",
          border: "1px solid rgba(96, 165, 250, 0.2)",
        }}
      >
        <CardContent>
          <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
            🚧 Funzionalità in fase di implementazione
          </Typography>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            EBSI Wallet v1.0.0
          </Typography>
        </CardContent>
      </Card>

      {/* Back button */}
      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Button
          variant="outlined"
          size="large"
          onClick={() => navigate("/home")}
          fullWidth
          sx={{
            borderRadius: 3,
            py: 1.5,
          }}
        >
          Torna alla Home
        </Button>
      </Box>

      {/* Dialog conferma eliminazione */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => !deleting && setOpenDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <WarningAmberIcon sx={{ color: "error.main", fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700}>
              Conferma Eliminazione Wallet
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Alert severity="error" variant="outlined">
              <Typography variant="body2" fontWeight={600} gutterBottom>
                ⚠️ Operazione irreversibile!
              </Typography>
              <Typography variant="caption">Verranno eliminati permanentemente:</Typography>
              <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
                <li>
                  <Typography variant="caption">DID e identità digitale</Typography>
                </li>
                <li>
                  <Typography variant="caption">Chiavi private e pubbliche</Typography>
                </li>
                <li>
                  <Typography variant="caption">Tutte le credenziali verificabili</Typography>
                </li>
                <li>
                  <Typography variant="caption">Impostazioni e preferenze</Typography>
                </li>
              </ul>
            </Alert>

            {error && (
              <Alert severity="error" onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            <Box>
              <Typography variant="body2" gutterBottom fontWeight={600}>
                Per confermare, digita <strong>ELIMINA</strong> nel campo sottostante:
              </Typography>
              <TextField
                fullWidth
                placeholder="ELIMINA"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={deleting}
                sx={{ mt: 1 }}
                inputProps={{
                  style: { textTransform: "uppercase" },
                }}
              />
            </Box>

            <Alert severity="info" variant="outlined">
              <Typography variant="caption">
                💡 Assicurati di aver fatto il backup della tua seed phrase prima di procedere.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setOpenDeleteDialog(false);
              setConfirmText("");
              setError("");
            }}
            disabled={deleting}
          >
            Annulla
          </Button>
          <Button
            onClick={handleResetWallet}
            color="error"
            variant="contained"
            disabled={confirmText !== "ELIMINA" || deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <DeleteForeverIcon />}
          >
            {deleting ? "Eliminazione..." : "Elimina Tutto"}
          </Button>
        </DialogActions>
      </Dialog>
    </PageBase>
  );
}
