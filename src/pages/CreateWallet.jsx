import { useState } from "react";
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { generateMnemonic, mnemonicToSeed } from "../crypto/seedManager.js";
import { derivePrivateKey, createJWK } from "../crypto/keyDerivation.js";
import { generateDID, createDIDDocument } from "../identity/didManager.js";
import { saveDID, saveDIDDocument, saveKeys } from "../storage/didStorage.js";
import SeedPhraseDisplay from "../components/SeedPhraseDisplay.jsx";
import PageBase from "../components/PageBase.jsx";

const steps = ["Genera Seed", "Backup Sicuro", "Conferma"];

export default function CreateWallet() {
  const [activeStep, setActiveStep] = useState(0);
  const [mnemonic, setMnemonic] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleGenerate = () => {
    const newMnemonic = generateMnemonic();
    setMnemonic(newMnemonic);
    setActiveStep(1);
  };

  const handleBackupConfirmed = () => {
    setConfirmed(true);
    setActiveStep(2);
  };

  const handleFinish = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Deriva seed
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

      // 7. Marca come completato
      localStorage.setItem("wallet_initialized", "true");

      // 8. Naviga alla home
      navigate("/home");
    } catch (err) {
      setError("Errore durante la creazione del wallet: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageBase title="Crea Wallet">
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Crea Nuovo Wallet
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper elevation={3} sx={{ p: 4 }}>
          {/* Step 0: Introduzione */}
          {activeStep === 0 && (
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h5" gutterBottom>
                Genera la tua Seed Phrase
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                La seed phrase è la chiave di accesso al tuo wallet. Conservala in modo sicuro e non
                condividerla con nessuno.
              </Typography>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <strong>Importante:</strong> Perderai l'accesso al wallet se perdi la seed phrase.
                Non è possibile recuperarla.
              </Alert>
              <Button variant="contained" size="large" onClick={handleGenerate}>
                Genera Seed Phrase
              </Button>
            </Box>
          )}

          {/* Step 1: Display seed phrase */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h5" gutterBottom align="center">
                Salva la tua Seed Phrase
              </Typography>
              <Alert severity="error" sx={{ mb: 3 }}>
                <strong>ATTENZIONE:</strong> Scrivi queste parole su carta e conservale in un luogo
                sicuro. Chiunque abbia accesso a questa frase può controllare il tuo wallet.
              </Alert>

              <SeedPhraseDisplay mnemonic={mnemonic} />

              <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                <Button variant="outlined" fullWidth onClick={() => setActiveStep(0)}>
                  Indietro
                </Button>
                <Button variant="contained" fullWidth onClick={handleBackupConfirmed}>
                  Ho salvato la seed phrase
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 2: Conferma e completa */}
          {activeStep === 2 && (
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h5" gutterBottom>
                Conferma Backup
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Hai salvato la seed phrase in modo sicuro? Senza di essa non potrai recuperare il
                tuo wallet.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Alert severity="info" sx={{ mb: 3 }}>
                Cliccando su "Completa", confermi di aver salvato la seed phrase e di comprendere
                che non è possibile recuperarla.
              </Alert>

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button variant="outlined" fullWidth onClick={() => setActiveStep(1)}>
                  Indietro
                </Button>
                <Button variant="contained" fullWidth onClick={handleFinish} disabled={loading}>
                  {loading ? "Creazione in corso..." : "Completa"}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Container>
    </PageBase>
  );
}
