import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import WarningIcon from "@mui/icons-material/Warning";

/**
 * Dialog tutorial per la gestione sicura della seed phrase
 * @param {Object} props
 * @param {boolean} props.open - Stato di apertura del dialog
 * @param {Function} props.onClose - Callback per la chiusura
 * @returns {JSX.Element}
 */
export default function SeedPhraseTutorial({ open, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="seed-phrase-tutorial-title"
    >
      <DialogTitle id="seed-phrase-tutorial-title">
        <WarningIcon color="warning" sx={{ mr: 1, verticalAlign: "middle" }} aria-hidden="true" />
        Informazioni Seed Phrase
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }} role="alert">
          La seed phrase è la chiave di recupero del tuo wallet. Proteggila con la massima cura!
        </Alert>

        <Typography variant="h6" gutterBottom component="h2">
          Cosa Fare ✅
        </Typography>
        <List dense aria-label="Buone pratiche per la seed phrase">
          <ListItem>
            <ListItemIcon>
              <CheckIcon color="success" aria-hidden="true" />
            </ListItemIcon>
            <ListItemText primary="Scrivila su carta in modo leggibile" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckIcon color="success" aria-hidden="true" />
            </ListItemIcon>
            <ListItemText primary="Conservala in un luogo sicuro (cassaforte, cassetta di sicurezza)" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckIcon color="success" aria-hidden="true" />
            </ListItemIcon>
            <ListItemText primary="Fai una copia di backup in un altro luogo sicuro" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckIcon color="success" aria-hidden="true" />
            </ListItemIcon>
            <ListItemText primary="Verifica di aver scritto tutte le parole correttamente" />
          </ListItem>
        </List>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }} component="h2">
          Cosa NON Fare ❌
        </Typography>
        <List dense aria-label="Pratiche da evitare per la seed phrase">
          <ListItem>
            <ListItemIcon>
              <WarningIcon color="error" aria-hidden="true" />
            </ListItemIcon>
            <ListItemText primary="NON fare screenshot della seed phrase" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <WarningIcon color="error" aria-hidden="true" />
            </ListItemIcon>
            <ListItemText primary="NON salvarla su cloud o email" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <WarningIcon color="error" aria-hidden="true" />
            </ListItemIcon>
            <ListItemText primary="NON condividerla con nessuno" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <WarningIcon color="error" aria-hidden="true" />
            </ListItemIcon>
            <ListItemText primary="NON digitarla su siti web o app sospette" />
          </ListItem>
        </List>

        <Alert severity="error" sx={{ mt: 3 }} role="alert">
          <strong>Importante:</strong> Se perdi la seed phrase, perderai accesso al tuo wallet in
          modo permanente!
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained" aria-label="Chiudi tutorial">
          Ho Capito
        </Button>
      </DialogActions>
    </Dialog>
  );
}
