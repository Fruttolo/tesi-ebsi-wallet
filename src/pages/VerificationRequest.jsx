import { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import InfoIcon from "@mui/icons-material/Info";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import {
  validatePresentationRequest,
  createPresentationResponse,
} from "../protocols/presentationExchange";
import { vcManager } from "../credentials/vcManager";
import PageBase from "../components/PageBase";

/**
 * Pagina per gestire richieste di verifica ricevute via QR code
 * Mostra i dettagli della richiesta e permette all'utente di approvarla o rifiutarla
 */
export default function VerificationRequest() {
  const location = useLocation();
  const navigate = useNavigate();
  const request = location.state?.request;

  const [approved, setApproved] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [suitableCredentials, setSuitableCredentials] = useState([]);

  useEffect(() => {
    if (request) {
      findSuitableCredentials();
    }
  }, [request]);

  // Verifica se ci sono credenziali adatte
  const findSuitableCredentials = async () => {
    try {
      const credentials = await vcManager.getCredentials();

      // Filtra credenziali che soddisfano i requisiti
      const suitable = credentials.filter((credential) => {
        if (request.requirements?.constraints?.credentialType) {
          const types = request.requirements.constraints.credentialType;
          return credential.type?.some((t) => types.includes(t));
        }
        return true; // Se no requisiti specifici, tutte le credenziali vanno bene
      });

      setSuitableCredentials(suitable);
    } catch (err) {
      console.error("APP-EBSI: Errore ricerca credenziali:", err);
      setError("Errore nella ricerca delle credenziali");
    }
  };

  if (!request) {
    return (
      <PageBase title="Richiesta Verifica">
        <Container maxWidth="sm" sx={{ py: 4, textAlign: "center" }}>
          <WarningIcon sx={{ fontSize: 64, color: "warning.main", mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Nessuna richiesta trovata
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Scansiona un QR code di verifica per continuare
          </Typography>
          <Button variant="contained" onClick={() => navigate("/scan-qr")}>
            Scansiona QR Code
          </Button>
        </Container>
      </PageBase>
    );
  }

  // Valida richiesta
  const validation = validatePresentationRequest(request);

  const handleApprove = async () => {
    if (suitableCredentials.length === 0) {
      setError("Nessuna credenziale adatta trovata per questa richiesta");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      // Usa la prima credenziale adatta (in futuro permettere scelta)
      const credential = suitableCredentials[0];

      // Crea response
      const resp = await createPresentationResponse(
        request,
        credential,
        { privateKey: null } // TODO: get from wallet
      );

      setResponse(resp);
      setApproved(true);

      // Invia al verifier se c'è un callback URL
      if (request.callbackUrl) {
        await sendResponse(request.callbackUrl, resp);
      }

      // Reindirizza dopo successo
      setTimeout(() => {
        navigate("/home", { state: { message: "Verifica completata con successo!" } });
      }, 2000);
    } catch (err) {
      console.error("APP-EBSI: Errore creazione risposta:", err);
      setError("Errore nella creazione della risposta di verifica");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = () => {
    navigate("/home");
  };

  return (
    <PageBase title="Richiesta Verifica">
      <Container maxWidth="sm" sx={{ py: 2 }}>
        {!validation.valid ? (
          <Alert severity="error" icon={<WarningIcon />}>
            <Typography variant="body2" fontWeight={600}>
              Richiesta non valida
            </Typography>
            <Typography variant="caption">{validation.errors.join(", ")}</Typography>
          </Alert>
        ) : (
          <>
            {/* Header Card */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                background:
                  "linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
                border: "1px solid rgba(96, 165, 250, 0.3)",
              }}
            >
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <VerifiedUserIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
                <Typography variant="h5" gutterBottom fontWeight={600}>
                  {request.purpose || "Richiesta di Verifica"}
                </Typography>
                <Chip
                  label={request.domain || "Dominio sconosciuto"}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Requisiti */}
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Dati richiesti:
              </Typography>
              <List dense>
                {request.requirements?.constraints?.fields?.map((field, i) => (
                  <ListItem key={i}>
                    <ListItemIcon>
                      <InfoIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        field.filter?.type === "ageOver"
                          ? `Età maggiore di ${field.filter.minimum} anni`
                          : field.path?.join(".") || "Requisito generico"
                      }
                    />
                  </ListItem>
                ))}
                {(!request.requirements?.constraints?.fields ||
                  request.requirements.constraints.fields.length === 0) && (
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Verifica identità generica" />
                  </ListItem>
                )}
              </List>
            </Paper>

            {/* Privacy Alert */}
            <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                🔒 Privacy Garantita
              </Typography>
              <Typography variant="caption">
                I tuoi dati personali NON saranno condivisi. Verrà inviata solo una prova
                crittografica che conferma i requisiti richiesti.
              </Typography>
            </Alert>

            {/* Credenziali disponibili */}
            {suitableCredentials.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 3,
                  background: "rgba(16, 185, 129, 0.05)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                }}
              >
                <Typography variant="subtitle2" color="success.main" fontWeight={600}>
                  ✓ {suitableCredentials.length} credenziale
                  {suitableCredentials.length > 1 ? "i" : ""} disponibile
                  {suitableCredentials.length > 1 ? "i" : ""}
                </Typography>
              </Paper>
            )}

            {suitableCredentials.length === 0 && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Nessuna credenziale adatta trovata per questa richiesta
                </Typography>
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            {/* Action Buttons */}
            {!approved ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleApprove}
                  fullWidth
                  size="large"
                  disabled={processing || suitableCredentials.length === 0}
                  startIcon={
                    processing ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <CheckCircleIcon />
                    )
                  }
                  sx={{ py: 1.5 }}
                >
                  {processing ? "Elaborazione..." : "Approva Verifica"}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleReject}
                  fullWidth
                  size="large"
                  disabled={processing}
                  sx={{ py: 1.5 }}
                >
                  Rifiuta
                </Button>
              </Box>
            ) : (
              <Alert
                severity="success"
                icon={<CheckCircleIcon />}
                sx={{
                  "& .MuiAlert-message": {
                    width: "100%",
                  },
                }}
              >
                <Typography variant="body1" fontWeight={600}>
                  ✓ Verifica completata con successo!
                </Typography>
                <Typography variant="caption">Reindirizzamento in corso...</Typography>
              </Alert>
            )}
          </>
        )}
      </Container>
    </PageBase>
  );
}

/**
 * Invia la risposta al verifier
 */
async function sendResponse(url, response) {
  if (!url) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(response),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.error("APP-EBSI: Errore invio risposta:", err);
    throw err;
  }
}
