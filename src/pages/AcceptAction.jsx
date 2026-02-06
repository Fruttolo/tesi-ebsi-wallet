import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { discoverOpenID } from "../flows/genericFlow";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Typography,
} from "@mui/material";

export const AcceptAction = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { uri, type } = location.state || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [requiresPreAuth, setRequiresPreAuth] = useState(false);
  const [issuerName, setIssuerName] = useState("");
  const [credentialOffer, setCredentialOffer] = useState([]);
  const [pin, setPin] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [urlAuthorization, setUrlAuthorization] = useState("");

  useEffect(() => {
    const processAction = async () => {
      try {
        const res = await discoverOpenID(uri);

        console.log("Discovery result:", res);

        if (res) {
          setRequiresPreAuth(res.requiresPreAuth || false);
          setIssuerName(res.issuerName || "");
          setCredentialOffer(res.credentialOffer || []);
          setLoading(false);
          setUrlAuthorization(res.urlAuthorization || "");
        }
      } catch (error) {
        console.error("Error processing action:", error);
        setError(error.message || "Error processing action");
        setLoading(false);
      }
    };

    if (uri && type) {
      processAction();
    } else {
      console.error("Missing URI or type for action processing");
      setError("Missing URI or type for action processing");
      setLoading(false);
    }
  }, [uri, type, navigate]);

  const acceptOffer = async () => {
    // Se richiede pre-auth e non c'è ancora il PIN, apri il modal
    if (requiresPreAuth && !pin) {
      setShowPinModal(true);
      return;
    }

    navigate("/credential-offer", {
      state: {
        url: urlAuthorization,
        pin: pin || null,
      },
    });
  };

  const declineOffer = () => {
    navigate("/", { replace: true });
  };

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      {loading && (
        <Box sx={{ textAlign: "center", mt: 6 }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Processing...
          </Typography>
        </Box>
      )}
      {!loading && (
        <>
          {error ? (
            <Alert severity="error">
              <Typography variant="h6" gutterBottom>
                Error
              </Typography>
              <Typography variant="body2">{error}</Typography>
            </Alert>
          ) : (
            <Container maxWidth="sm" sx={{ py: 3 }}>
              {/* Info Issuer */}
              <Card sx={{ mb: 3, mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Offerta credenziale
                  </Typography>
                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Issuer
                    </Typography>
                    <Typography variant="body1" sx={{ wordBreak: "break-all", fontWeight: 500 }}>
                      {issuerName || "Unknown Issuer"}
                    </Typography>
                  </Box>

                  {/* Credential Types */}
                  {credentialOffer.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Credenziali Offerte
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                          mt: 1,
                        }}
                      >
                        {credentialOffer.map((cred, index) => (
                          <Card
                            key={index}
                            variant="outlined"
                            sx={{ bgcolor: "background.default" }}
                          >
                            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                {/* Nome della credenziale */}
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {cred.trust_framework.name || "No Name provided"}
                                </Typography>

                                {/* Trust Framework Type */}
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Trust Framework:
                                  </Typography>
                                  <Chip
                                    label={cred.trust_framework.type || "Unknown"}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                </Box>

                                {/* Credential Types */}
                                {cred.types && cred.types.length > 0 && (
                                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      Types:
                                    </Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                      {cred.types.map((t, i) => (
                                        <Chip key={i} label={t} variant="outlined" size="small" />
                                      ))}
                                    </Box>
                                  </Box>
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Flow Type */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Tipo di flusso
                    </Typography>
                    <Chip
                      label={requiresPreAuth ? "Pre-Authorized" : "Authorization Code"}
                      color="primary"
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>

              {/* Discovery Status */}
              {loading && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                  <CircularProgress size={24} />
                  <Typography>Caricamento configurazioni...</Typography>
                </Box>
              )}

              {/* Errori */}
              {error && (
                <Alert
                  severity="error"
                  icon={<ErrorIcon />}
                  sx={{ mb: 3 }}
                  onClose={() => setError("")}
                >
                  {error}
                </Alert>
              )}

              {/* Azioni */}
              <Box sx={{ display: "flex", gap: 2, flexDirection: "row" }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={acceptOffer}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? <CircularProgress size={24} /> : "Accetta"}
                </Button>

                <Button
                  variant="contained"
                  size="large"
                  onClick={declineOffer}
                  disabled={loading}
                  fullWidth
                >
                  Rifiuta
                </Button>
              </Box>

              {/* Modal PIN */}
              <Dialog
                open={showPinModal}
                onClose={() => setShowPinModal(false)}
                maxWidth="sm"
                fullWidth
              >
                <DialogTitle>PIN Richiesto</DialogTitle>
                <DialogContent>
                  <Typography variant="body2" sx={{ mb: 3, mt: 1 }}>
                    Questa credenziale richiede un PIN. Inserisci il PIN fornito dall'issuer.
                  </Typography>
                  <TextField
                    fullWidth
                    label="PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    type="number"
                    inputProps={{ maxLength: 10 }}
                    placeholder="Inserisci PIN"
                    autoFocus
                  />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                  <Button variant="contained" onClick={() => setShowPinModal(false)}>
                    Annulla
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setShowPinModal(false);
                      acceptOffer();
                    }}
                    disabled={!pin}
                  >
                    Conferma
                  </Button>
                </DialogActions>
              </Dialog>
            </Container>
          )}
        </>
      )}
    </Container>
  );
};
