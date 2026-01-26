import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Button,
  Paper,
  Divider,
  Alert,
  Box,
  CircularProgress,
} from "@mui/material";
import { createSelectivePresentation } from "../credentials/selective/selectiveVC";
import PageBase from "../components/PageBase";
import AttributeSelector from "../components/AttributeSelector";

export default function SelectivePresentation({ credential, onComplete }) {
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [presentation, setPresentation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreatePresentation = async () => {
    try {
      setLoading(true);
      setError(null);

      const vp = await createSelectivePresentation(credential, selectedAttributes, {
        holder: "did:ebsi:holder", // TODO: get from wallet
        challenge: "challenge_from_verifier",
      });

      setPresentation(vp);
      if (onComplete) {
        onComplete(vp);
      }
    } catch (err) {
      console.error("Error creating presentation:", err);
      setError(err.message || "Errore nella creazione della presentazione");
    } finally {
      setLoading(false);
    }
  };

  const getAttributeCount = () => {
    if (!credential?.credentialSubject) return { total: 0, revealed: 0 };

    const total = Object.keys(credential.credentialSubject).filter((k) => k !== "id").length;
    return {
      total,
      revealed: selectedAttributes.length,
      hidden: total - selectedAttributes.length,
    };
  };

  const counts = getAttributeCount();

  return (
    <PageBase title="Selective Disclosure">
      <Container maxWidth="md">
        <Alert severity="info" sx={{ mb: 3 }}>
          Seleziona quali attributi vuoi rivelare. Gli altri rimarranno nascosti ma la validità
          della credenziale sarà comunque verificabile grazie alle BBS+ signatures.
        </Alert>

        <AttributeSelector
          credential={credential}
          selectedAttributes={selectedAttributes}
          onSelectionChange={setSelectedAttributes}
        />

        <Paper sx={{ p: 3, my: 3 }}>
          <Typography variant="h6" gutterBottom>
            Anteprima Presentazione
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Attributi rivelati
              </Typography>
              <Typography variant="h4" color="primary.main">
                {counts.revealed}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Attributi nascosti
              </Typography>
              <Typography variant="h4" color="warning.main">
                {counts.hidden}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Totale attributi
              </Typography>
              <Typography variant="h4">{counts.total}</Typography>
            </Box>
          </Box>

          {selectedAttributes.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Saranno rivelati:
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {selectedAttributes.map((key) => (
                  <Paper key={key} sx={{ px: 2, py: 1, bgcolor: "primary.light" }}>
                    <Typography variant="body2">
                      {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          fullWidth
          onClick={handleCreatePresentation}
          disabled={selectedAttributes.length === 0 || loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? "Creazione in corso..." : "Crea Presentazione Selettiva"}
        </Button>

        {presentation && (
          <Paper
            sx={{
              p: 2,
              mt: 3,
              bgcolor: "success.light",
              border: "2px solid",
              borderColor: "success.main",
            }}
          >
            <Typography variant="body2" color="success.dark" fontWeight="bold">
              ✓ Presentazione creata con successo!
            </Typography>
            <Typography variant="caption" color="success.dark" sx={{ mt: 1 }}>
              La presentazione include solo gli attributi selezionati ma mantiene la piena
              verificabilità crittografica.
            </Typography>
          </Paper>
        )}
      </Container>
    </PageBase>
  );
}
