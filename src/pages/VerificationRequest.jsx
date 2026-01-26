import { useState } from "react";
import { Container, Paper, Typography, Button, Box, Alert } from "@mui/material";
import {
  validatePresentationRequest,
  createPresentationResponse,
} from "../protocols/presentationExchange";
import { vcManager } from "../credentials/vcManager";
import PageBase from "../components/PageBase";

export default function VerificationRequest({ request }) {
  const [approved, setApproved] = useState(false);
  const [response, setResponse] = useState(null);

  // Valida richiesta
  const validation = validatePresentationRequest(request);

  const handleApprove = async () => {
    try {
      // Trova credenziale appropriata
      const credentials = await vcManager.getCredentials();
      const suitable = credentials.find(
        (c) => c.credentialSubject.dateOfBirth // Ha data di nascita
      );

      if (!suitable) {
        alert("Nessuna credenziale adatta trovata");
        return;
      }

      // Crea response
      const resp = await createPresentationResponse(
        request,
        suitable,
        { privateKey: null } // TODO: get from wallet
      );

      setResponse(resp);
      setApproved(true);

      // Invia al verifier
      await sendResponse(request.callbackUrl, resp);
    } catch (error) {
      console.error("Error creating response:", error);
      alert("Errore nella creazione della risposta");
    }
  };

  const handleReject = () => {
    // Close modal o redirect
    window.history.back();
  };

  return (
    <PageBase title="Richiesta Verifica">
      <Container maxWidth="md">
        {!validation.valid ? (
          <Alert severity="error">Richiesta non valida: {validation.errors.join(", ")}</Alert>
        ) : (
          <>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {request.purpose || "Verifica Identità"}
              </Typography>

              <Box sx={{ my: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Da:</strong> {request.domain}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Richiede:</strong>
                </Typography>
                <ul>
                  {request.requirements?.constraints?.fields?.map((field, i) => (
                    <li key={i}>
                      <Typography variant="body2">
                        {field.filter.type === "ageOver"
                          ? `Età maggiore di ${field.filter.minimum} anni`
                          : field.path.join(".")}
                      </Typography>
                    </li>
                  ))}
                </ul>
              </Box>

              <Alert severity="info">
                I tuoi dati personali NON saranno condivisi. Verrà inviata solo una prova
                crittografica.
              </Alert>
            </Paper>

            {!approved ? (
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button variant="contained" color="primary" onClick={handleApprove} fullWidth>
                  Approva
                </Button>
                <Button variant="outlined" color="error" onClick={handleReject} fullWidth>
                  Rifiuta
                </Button>
              </Box>
            ) : (
              <Alert severity="success">✓ Verifica completata con successo!</Alert>
            )}
          </>
        )}
      </Container>
    </PageBase>
  );
}

async function sendResponse(url, response) {
  if (!url) return;

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(response),
  });
}
