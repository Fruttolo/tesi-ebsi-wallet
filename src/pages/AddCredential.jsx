import { Container, Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import PageBase from "../components/PageBase";

/**
 * Pagina per aggiungere nuove credenziali
 * TODO: Implementare ricezione VC
 */
export default function AddCredential() {
  const navigate = useNavigate();

  return (
    <PageBase title="Aggiungi Credenziale">
      <Container maxWidth="sm" sx={{ py: 4, textAlign: "center" }}>
        <AddIcon sx={{ fontSize: 100, color: "primary.main", mb: 3 }} />
        <Typography variant="h4" gutterBottom>
          Aggiungi Credenziale
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Funzionalità in fase di implementazione
        </Typography>
        <Button variant="contained" onClick={() => navigate("/home")}>
          Torna alla Home
        </Button>
      </Container>
    </PageBase>
  );
}
