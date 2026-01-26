import { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Paper,
  Alert,
  Stack,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PageBase from "../components/PageBase";
import { VCManager } from "../credentials/vcManager";
import {
  parseCredential,
  validateCredentialStructure,
  formatCredentialForDisplay,
} from "../credentials/credentialParser";

/**
 * Pagina per aggiungere nuove credenziali
 */
export default function AddCredential() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [vcInput, setVcInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [parsedVC, setParsedVC] = useState(null);

  const vcManager = new VCManager();

  /**
   * Gestisce il cambio di tab
   */
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError("");
    setSuccess(false);
    setParsedVC(null);
  };

  /**
   * Valida e mostra preview della credenziale
   */
  const handlePreview = () => {
    setError("");
    setParsedVC(null);

    if (!vcInput.trim()) {
      setError("Inserisci una credenziale valida");
      return;
    }

    try {
      // Parse la credenziale
      const result = parseCredential(vcInput);

      if (!result.success) {
        setError(result.error);
        return;
      }

      const credential = result.credential;

      // Valida struttura
      const validation = validateCredentialStructure(credential);
      if (!validation.valid) {
        setError(`Credenziale non valida: ${validation.errors.join(", ")}`);
        return;
      }

      // Formatta per display
      const formatted = formatCredentialForDisplay(credential);
      setParsedVC(formatted);
    } catch (err) {
      setError(`Errore nel parsing: ${err.message}`);
    }
  };

  /**
   * Salva la credenziale nel wallet
   */
  const handleSave = async () => {
    if (!parsedVC) {
      setError("Nessuna credenziale da salvare");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Ricevi e salva la credenziale
      const result = await vcManager.receiveCredential(parsedVC.raw, {
        skipIssuerVerification: true, // Per ora salta verifica issuer EBSI
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/credentials");
        }, 2000);
      }
    } catch (err) {
      setError(`Errore nel salvataggio: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render del form di input manuale
   */
  const renderManualInput = () => (
    <Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Incolla qui la tua Verifiable Credential in formato JSON o JWT
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={10}
        placeholder='{"@context": [...], "type": [...], ...}'
        value={vcInput}
        onChange={(e) => setVcInput(e.target.value)}
        variant="outlined"
        sx={{ mb: 2, fontFamily: "monospace" }}
      />

      <Stack direction="row" spacing={2}>
        <Button variant="outlined" fullWidth onClick={handlePreview} disabled={!vcInput.trim()}>
          Valida e Preview
        </Button>
        <Button
          variant="contained"
          onClick={() => navigate("/scan-qr")}
          startIcon={<QrCodeScannerIcon />}
        >
          Scansiona QR
        </Button>
      </Stack>
    </Box>
  );

  /**
   * Render della preview della credenziale
   */
  const renderPreview = () => {
    if (!parsedVC) return null;

    return (
      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Preview Credenziale
        </Typography>

        <Stack spacing={2}>
          {/* Tipo */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Tipo
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
              {parsedVC.type.map((t) => (
                <Chip key={t} label={t} size="small" color="primary" variant="outlined" />
              ))}
            </Stack>
          </Box>

          {/* Categoria */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Categoria
            </Typography>
            <Typography variant="body2">{parsedVC.category}</Typography>
          </Box>

          {/* Issuer */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Emittente
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
              {parsedVC.issuer.name}
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ fontFamily: "monospace" }}>
              {parsedVC.issuer.did}
            </Typography>
          </Box>

          {/* Subject DID */}
          {parsedVC.subject.did && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Subject DID
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontFamily: "monospace", wordBreak: "break-all", display: "block" }}
              >
                {parsedVC.subject.did}
              </Typography>
            </Box>
          )}

          {/* Attributi */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Attributi
            </Typography>
            <Box sx={{ mt: 1 }}>
              {Object.entries(parsedVC.attributes).map(([key, value]) => (
                <Box key={key} sx={{ display: "flex", gap: 1, mb: 0.5 }}>
                  <Typography variant="body2" fontWeight="bold">
                    {key}:
                  </Typography>
                  <Typography variant="body2">{JSON.stringify(value)}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Date */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Emissione
            </Typography>
            <Typography variant="body2">
              {new Date(parsedVC.issuanceDate).toLocaleString()}
            </Typography>
          </Box>

          {parsedVC.expirationDate && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Scadenza
              </Typography>
              <Typography variant="body2" color={parsedVC.expired ? "error" : "text.primary"}>
                {new Date(parsedVC.expirationDate).toLocaleString()}
                {parsedVC.expired && " (SCADUTA)"}
                {!parsedVC.expired && parsedVC.daysUntilExpiration !== null && (
                  <> ({parsedVC.daysUntilExpiration} giorni rimanenti)</>
                )}
              </Typography>
            </Box>
          )}

          {/* Proof */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Proof
            </Typography>
            <Typography variant="body2">
              {parsedVC.hasProof ? "Presente ✓" : "Assente ✗"}
            </Typography>
          </Box>
        </Stack>

        {/* Bottoni azione */}
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              setParsedVC(null);
              setVcInput("");
            }}
          >
            Annulla
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleSave}
            disabled={loading || parsedVC.expired}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {loading ? "Salvataggio..." : "Aggiungi al Wallet"}
          </Button>
        </Stack>
      </Paper>
    );
  };

  /**
   * Render della schermata di successo
   */
  if (success) {
    return (
      <PageBase title="Aggiungi Credenziale">
        <Container maxWidth="sm" sx={{ py: 4, textAlign: "center" }}>
          <CheckCircleIcon sx={{ fontSize: 100, color: "success.main", mb: 3 }} />
          <Typography variant="h4" gutterBottom>
            Credenziale Aggiunta!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            La credenziale è stata salvata con successo nel tuo wallet
          </Typography>
          <CircularProgress />
          <Typography variant="caption" display="block" sx={{ mt: 2 }}>
            Reindirizzamento...
          </Typography>
        </Container>
      </PageBase>
    );
  }

  return (
    <PageBase title="Aggiungi Credenziale">
      <Container maxWidth="md" sx={{ py: 3 }}>
        {/* Tabs per modalità input */}
        <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 3 }}>
          <Tab icon={<EditNoteIcon />} label="Input Manuale" />
          <Tab icon={<QrCodeScannerIcon />} label="Scansiona QR" disabled />
        </Tabs>

        {/* Messaggi di errore */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Form input */}
        {tabValue === 0 && renderManualInput()}

        {/* Preview credenziale */}
        {renderPreview()}

        {/* Info aggiuntiva */}
        <Paper elevation={1} sx={{ p: 2, mt: 3, backgroundColor: "rgba(25, 118, 210, 0.08)" }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Nota:</strong> Le credenziali devono essere conformi allo standard W3C
            Verifiable Credentials. Puoi ottenere credenziali da issuer certificati o utilizzare il
            QR code scanner per riceverle direttamente.
          </Typography>
        </Paper>
      </Container>
    </PageBase>
  );
}
