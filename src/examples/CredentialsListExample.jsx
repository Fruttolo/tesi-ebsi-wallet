/**
 * Esempio di utilizzo dei componenti UI/UX nella pagina CredentialsList
 * Questo file mostra come integrare i nuovi componenti per migliorare l'esperienza utente
 */

import { useState, useEffect } from "react";
import { Container, Typography, Button, Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

// Import nuovi componenti UI/UX
import LoadingState from "@/components/LoadingState";
import { ListSkeleton } from "@/components/SkeletonLoader";
import ErrorState from "@/components/ErrorState";
import SuccessSnackbar from "@/components/SuccessSnackbar";

// Import esistenti
import { getStoredCredentials } from "@/storage/credentialStorage";
import PageBase from "@/components/PageBase";

/**
 * Esempio di pagina con gestione completa degli stati UI
 */
export default function CredentialsListExample() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Carica credenziali all'avvio
  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simula caricamento
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const stored = await getStoredCredentials();
      setCredentials(stored);
    } catch (err) {
      console.error("Errore caricamento credenziali:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (credentialId) => {
    try {
      // Logica di eliminazione
      await deleteCredential(credentialId);

      // Ricarica lista
      await loadCredentials();

      // Mostra feedback successo
      setSuccessMessage("Credenziale eliminata con successo");
      setShowSuccess(true);
    } catch (err) {
      console.error("Errore eliminazione:", err);
      setError(err);
    }
  };

  // Rendering condizionale basato sullo stato

  // STATO: Loading
  if (loading) {
    return (
      <PageBase title="Le Mie Credenziali">
        {/* Opzione 1: Loading generico */}
        <LoadingState message="Caricamento credenziali..." />

        {/* Opzione 2: Skeleton (migliore per liste) */}
        {/* <ListSkeleton items={3} /> */}
      </PageBase>
    );
  }

  // STATO: Errore
  if (error) {
    return (
      <PageBase title="Le Mie Credenziali">
        <ErrorState
          title="Errore nel caricamento delle credenziali"
          message={error.message}
          onRetry={loadCredentials}
        />
      </PageBase>
    );
  }

  // STATO: Empty state
  if (credentials.length === 0) {
    return (
      <PageBase title="Le Mie Credenziali">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "300px",
            textAlign: "center",
            p: 3,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Nessuna credenziale salvata
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Aggiungi la tua prima credenziale per iniziare
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              /* Navigate to add credential */
            }}
          >
            Aggiungi Credenziale
          </Button>
        </Box>
      </PageBase>
    );
  }

  // STATO: Successo con dati
  return (
    <PageBase title="Le Mie Credenziali">
      <Container>
        {/* Lista credenziali */}
        {credentials.map((credential) => (
          <CredentialCard key={credential.id} credential={credential} onDelete={handleDelete} />
        ))}

        {/* Success feedback */}
        <SuccessSnackbar
          open={showSuccess}
          message={successMessage}
          onClose={() => setShowSuccess(false)}
        />
      </Container>
    </PageBase>
  );
}

// Helper function (da implementare)
async function deleteCredential(id) {
  // Implementation
}
