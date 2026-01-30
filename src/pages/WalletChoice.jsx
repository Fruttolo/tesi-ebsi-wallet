import { Container, Typography, Button, Box, Card, CardContent, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AddIcon from "@mui/icons-material/Add";

/**
 * Pagina per la scelta tra creazione nuovo wallet o importazione esistente
 */
export default function WalletChoice() {
  const navigate = useNavigate();

  const handleCreateNew = () => {
    navigate("/wallet-setup");
  };

  const handleImport = () => {
    navigate("/import-wallet");
  };

  return (
    <Container
      maxWidth="sm"
      sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}
    >
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Configura il tuo Wallet
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Scegli come iniziare con il tuo portafoglio digitale
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card
            sx={{
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 6,
              },
            }}
            onClick={handleCreateNew}
          >
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <AddIcon sx={{ fontSize: 48, color: "primary.main", mb: 1.5 }} />
              <Typography variant="h5" gutterBottom>
                Crea Nuovo Wallet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Genera una nuova identità digitale con una seed phrase sicura
              </Typography>
              <Button variant="contained" sx={{ mt: 2 }} fullWidth>
                Inizia
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card
            sx={{
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 6,
              },
            }}
            onClick={handleImport}
          >
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <FileDownloadIcon sx={{ fontSize: 48, color: "primary.main", mb: 1.5 }} />
              <Typography variant="h5" gutterBottom>
                Importa Wallet Esistente
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recupera il tuo wallet usando una seed phrase esistente
              </Typography>
              <Button variant="contained" sx={{ mt: 2 }} fullWidth>
                Importa
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
