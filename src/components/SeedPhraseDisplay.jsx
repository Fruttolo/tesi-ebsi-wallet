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

export default function SeedPhraseDisplay({ mnemonic, onNext }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const words = mnemonic ? mnemonic.split(" ") : [];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleNext = () => {
    if (confirmed && onNext) {
      onNext();
    }
  };

  return (
    <Box>
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
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}
            >
              <Typography variant="h6">La tua Seed Phrase (12 parole)</Typography>
              <Box>
                <Button
                  size="small"
                  startIcon={copied ? null : <ContentCopyIcon />}
                  onClick={handleCopy}
                  variant="outlined"
                  sx={{ mr: 1 }}
                >
                  {copied ? "✓ Copiato" : "Copia"}
                </Button>
                <Button
                  size="small"
                  startIcon={<VisibilityOffIcon />}
                  onClick={() => setRevealed(false)}
                  variant="outlined"
                >
                  Nascondi
                </Button>
              </Box>
            </Box>

            <Grid container spacing={2}>
              {words.map((word, index) => (
                <Grid item xs={6} sm={4} md={3} key={index}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: 2,
                      textAlign: "center",
                      bgcolor: "background.default",
                      border: 1,
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" display="block">
                      {index + 1}
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      fontFamily="monospace"
                      sx={{ userSelect: "text" }}
                    >
                      {word}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
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
              />
            }
            label={
              <Typography variant="body2">
                Ho scritto e conservato in modo sicuro la mia seed phrase. Capisco che senza di essa
                non potrò mai recuperare l'accesso al mio wallet.
              </Typography>
            }
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            onClick={handleNext}
            fullWidth
            size="large"
            disabled={!confirmed}
          >
            {confirmed
              ? "Ho Salvato la Seed Phrase, Continua"
              : "Conferma di aver salvato la seed phrase"}
          </Button>
        </>
      )}
    </Box>
  );
}
