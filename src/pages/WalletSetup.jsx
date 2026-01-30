import { useState } from "react";
import {
  Button,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Box,
  Alert,
  Link,
} from "@mui/material";
import { generateMnemonic, mnemonicToSeed } from "../crypto/seedManager.js";
import { derivePrivateKey, createJWK } from "../crypto/keyDerivation.js";
import { generateDID, createDIDDocument } from "../identity/didManager.js";
import { saveDID, saveDIDDocument, saveKeys } from "../storage/didStorage.js";
import SeedPhraseDisplay from "../components/SeedPhraseDisplay.jsx";
const steps = ["Genera Seed", "Backup Seed", "Conferma Backup", "Completato"];

export default function WalletSetup() {
  const [activeStep, setActiveStep] = useState(0);
  const [mnemonic, setMnemonic] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    try {
      setError("");
      const newMnemonic = generateMnemonic(128);
      setMnemonic(newMnemonic);
      setActiveStep(1);
    } catch (err) {
      setError("Errore durante la generazione della seed phrase: " + err.message);
    }
  };

  const handleBackupConfirmed = () => {
    setActiveStep(2);
  };

  const handleComplete = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Deriva seed da mnemonic
      const seed = await mnemonicToSeed(mnemonic);

      // 2. Deriva chiave privata
      const privateKey = derivePrivateKey(seed);

      // 3. Crea JWK
      const { privateJwk, publicJwk } = createJWK(privateKey);

      // 4. Genera DID
      const did = generateDID(publicJwk);

      // 5. Crea DID Document
      const didDocument = createDIDDocument(did, publicJwk);

      // 6. Salva tutto
      await saveDID(did);
      await saveDIDDocument(didDocument);
      await saveKeys(privateJwk, publicJwk);

      // 7. Completa setup
      localStorage.setItem("wallet_initialized", "true");
      setActiveStep(3);
    } catch (err) {
      setError("Errore durante il setup del wallet: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Configura il tuo Wallet EBSI
      </Typography>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Crea una nuova identità decentralizzata per interagire con EBSI
      </Typography>

      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{
          mb: 2,
          "& .MuiStepLabel-label": {
            fontSize: "0.75rem",
            mt: 0.5,
          },
        }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Box sx={{ minHeight: 300 }}>
        {activeStep === 0 && (
          <Box textAlign="center">
            <Typography variant="h6" gutterBottom>
              Inizia creando una nuova seed phrase
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              La seed phrase è l'unica chiave per recuperare il tuo wallet. Conservala in un luogo
              sicuro!
            </Typography>
            <Button variant="contained" size="large" onClick={handleGenerate}>
              Genera Nuovo Wallet
            </Button>
          </Box>
        )}

        {activeStep === 1 && (
          <SeedPhraseDisplay mnemonic={mnemonic} onNext={handleBackupConfirmed} />
        )}

        {activeStep === 0 && (
          <Box textAlign="center" sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Hai già un wallet?{" "}
              <Link href="/import-wallet" underline="hover" sx={{ cursor: "pointer" }}>
                Importa Seed Phrase
              </Link>
            </Typography>
          </Box>
        )}

        {activeStep === 2 && (
          <Box textAlign="center">
            <Typography variant="h6" gutterBottom>
              Conferma il backup
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Hai scritto e conservato in modo sicuro la tua seed phrase? Non potrai recuperarla
              successivamente!
            </Typography>

            <Alert severity="warning" sx={{ mb: 3 }}>
              <strong>Importante:</strong> Senza la seed phrase non potrai mai recuperare l'accesso
              al tuo wallet. Assicurati di averla salvata!
            </Alert>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button
                fullWidth
                variant="contained"
                color="inherit"
                onClick={handleComplete}
                disabled={loading}
              >
                {loading ? "Creazione in corso..." : "Confermo, Completa Setup"}
              </Button>
              <Button fullWidth variant="contained" onClick={() => setActiveStep(1)}>
                Torna Indietro
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 3 && (
          <Box textAlign="center">
            <Typography variant="h5" color="success.main" gutterBottom>
              ✓ Wallet creato con successo!
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Il tuo wallet EBSI è pronto per essere utilizzato.
            </Typography>
            <Button variant="contained" href="/">
              Vai alla Home
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
}
