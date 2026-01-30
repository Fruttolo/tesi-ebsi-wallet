import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Alert,
  Grid,
  Paper,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { Toast } from "@capacitor/toast";
import { Clipboard } from "@capacitor/clipboard";

export default function SeedPhraseDisplay({ mnemonic, onNext }) {
  const [revealed, setRevealed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const words = mnemonic ? mnemonic.split(" ") : [];

  const handleCopy = async () => {
    try {
      await Clipboard.write({
        string: mnemonic,
      });
      await Toast.show({
        text: "Seed phrase copiata negli appunti",
        duration: "short",
        position: "bottom",
      });
    } catch (err) {
      console.error("APP-EBSI: Failed to copy:", err);
      await Toast.show({
        text: "Errore durante la copia",
        duration: "short",
        position: "bottom",
      });
    }
  };

  const handleNext = () => {
    if (confirmed && onNext) {
      onNext();
    }
  };

  return (
    <Box>
      {!revealed && (
        <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            ⚠️ ATTENZIONE MASSIMA!
          </Typography>
          <Typography variant="body2">
            Questa seed phrase è l'<strong>UNICA chiave</strong> per recuperare il tuo wallet.
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 0 }}>
            <li>
              Scrivila su carta e conservala in un luogo <strong>sicuro</strong>
            </li>
            <li>
              <strong>NON</strong> condividerla mai con nessuno
            </li>
            <li>
              <strong>NON</strong> salvarla su cloud, email o screenshot
            </li>
            <li>
              <strong>NON</strong> inserirla in siti web non verificati
            </li>
            <li>Chi possiede questa frase ha accesso completo al wallet</li>
          </Box>
        </Alert>
      )}

      {!revealed ? (
        <Box textAlign="center">
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Assicurati di essere in un luogo privato prima di visualizzare la seed phrase
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<VisibilityIcon />}
            onClick={() => setRevealed(true)}
          >
            Mostra Seed Phrase
          </Button>
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 1.5 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1.5,
              }}
            >
              <Typography variant="subtitle1" mb={1} fontWeight="bold" sx={{ fontSize: "0.95rem" }}>
                La tua Seed Phrase <br />
                (12 parole)
              </Typography>
              <Box display="flex" gap={1}>
                <Button
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopy}
                  variant="contained"
                  sx={{ py: 0.4, px: 1, fontSize: "0.75rem" }}
                >
                  Copia
                </Button>
                <Button
                  size="small"
                  startIcon={<VisibilityOffIcon />}
                  onClick={() => setRevealed(false)}
                  variant="contained"
                  sx={{ py: 0.4, px: 1, fontSize: "0.75rem" }}
                >
                  Nascondi
                </Button>
              </Box>
            </Box>

            <Grid
              container
              spacing={1.2}
              display={"flex"}
              justifyContent={"center"}
              alignItems={"center"}
            >
              {words.map((word, index) => (
                <Grid item xs={4} key={index}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 1.2,
                      textAlign: "center",
                      bgcolor: "background.default",
                      border: 1,
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ fontSize: "0.65rem", mb: 0.3 }}
                    >
                      {index + 1}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      fontFamily="monospace"
                      sx={{ userSelect: "text", fontSize: "0.9rem" }}
                    >
                      {word}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Alert severity="info" icon={false} sx={{ mb: 1.2, py: 0.5, px: 1.5 }}>
            <Typography variant="body2" sx={{ fontSize: "0.8rem", lineHeight: 1.3 }}>
              <strong>Suggerimento:</strong> Scrivi queste parole su carta nell'ordine corretto.
              Puoi anche usare il pulsante "Copia" per salvarle temporaneamente, ma ricorda di
              eliminarle dagli appunti dopo averle trascritte.
            </Typography>
          </Alert>

          <FormControlLabel
            control={
              <Checkbox
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                color="primary"
                sx={{ py: 0.5 }}
              />
            }
            label={
              <Typography variant="body2" sx={{ fontSize: "0.8rem", lineHeight: 1.3 }}>
                Ho scritto e conservato in modo sicuro la mia seed phrase. Capisco che senza di essa
                non potrò mai recuperare l'accesso al mio wallet.
              </Typography>
            }
            sx={{ mb: 1.2, mt: 0 }}
          />

          <Button
            variant="contained"
            onClick={handleNext}
            fullWidth
            disabled={!confirmed}
            sx={{ py: 1 }}
          >
            Conferma di aver salvato la seed
          </Button>
        </>
      )}
    </Box>
  );
}
