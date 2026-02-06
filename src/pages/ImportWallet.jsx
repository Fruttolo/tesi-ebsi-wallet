import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, TextField, Button, Box, Alert, Paper } from "@mui/material";
import { validateSeedPhrase } from "../utils/validation.js";
import { mnemonicToSeed, validateMnemonic } from "../crypto/seedManager.js";
import { derivePrivateKey, createJWK } from "../crypto/keyDerivation.js";
import { generateDID, createDIDDocument } from "../identity/didManager.js";
import { saveDID, saveDIDDocument, saveKeys } from "../storage/didStorage.js";

export default function ImportWallet() {
  const navigate = useNavigate();
  const [mnemonic, setMnemonic] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  const handleMnemonicChange = (e) => {
    const value = e.target.value;
    setMnemonic(value);
    setError("");
    setValidationErrors([]);

    // Validazione real-time
    if (value.trim()) {
      const validation = validateSeedPhrase(value);
      if (!validation.valid) {
        setValidationErrors(validation.errors);
      }
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setError("");
    setValidationErrors([]);

    try {
      // 1. Valida seed phrase
      const validation = validateSeedPhrase(mnemonic);
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        setLoading(false);
        return;
      }

      const trimmedMnemonic = mnemonic.trim().toLowerCase();

      // 2. Verifica BIP39
      if (!validateMnemonic(trimmedMnemonic)) {
        throw new Error("Seed phrase non valida secondo standard BIP39");
      }

      // 3. Deriva seed
      const seed = await mnemonicToSeed(trimmedMnemonic);

      // 4. Deriva chiave privata
      const privateKey = derivePrivateKey(seed);

      // 5. Crea JWK
      const { privateJwk, publicJwk } = createJWK(privateKey);

      // 6. Genera DID
      const did = generateDID(publicJwk);

      // 7. Crea DID Document
      const didDocument = createDIDDocument(did, publicJwk);

      // 8. Salva tutto
      await saveDID(did);
      await saveDIDDocument(didDocument);
      await saveKeys(privateJwk, publicJwk);

      // 9. Success
      setSuccess(true);
      setMnemonic(""); // Pulisci per sicurezza

      localStorage.setItem("wallet_initialized", "true");
    } catch (err) {
      setError("Errore durante l'importazione: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Importa Wallet Esistente
      </Typography>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Recupera il tuo wallet usando la seed phrase <br /> (12 parole)
      </Typography>

      {!success ? (
        <Paper elevation={3} sx={{ p: 2 }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Importante:</strong> Inserisci la tua seed phrase solo su questo dispositivo.
              Non condividerla mai e assicurati di essere in un luogo privato.
            </Typography>
          </Alert>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Seed Phrase (12 o 24 parole)"
            placeholder="parola1 parola2 parola3 ..."
            value={mnemonic}
            onChange={handleMnemonicChange}
            error={validationErrors.length > 0}
            helperText={
              validationErrors.length > 0
                ? validationErrors.join(". ")
                : "Inserisci le parole separate da spazi"
            }
            sx={{ mb: 3 }}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2 }}>
            <Button variant="contained" color="inherit" fullWidth href="/" sx={{ py: 1.2 }}>
              Annulla
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={handleImport}
              disabled={loading || !mnemonic.trim() || validationErrors.length > 0}
              sx={{ py: 1.2 }}
            >
              {loading ? "Importazione in corso..." : "Importa Wallet"}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Non hai ancora un wallet?{" "}
              <Button href="/wallet-setup" size="small">
                Crea Nuovo Wallet
              </Button>
            </Typography>
          </Box>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5" color="success.main" gutterBottom>
            ✓ Wallet importato con successo!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Il tuo wallet è stato ripristinato ed è pronto per essere utilizzato.
          </Typography>
          <Button variant="contained" href="/home">
            Vai alla Home
          </Button>
        </Paper>
      )}
    </Container>
  );
}
