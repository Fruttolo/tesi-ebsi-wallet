import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Grid, Card, CardContent, Typography, Box, Chip, Avatar, Button } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Toast } from "@capacitor/toast";
import PageBase from "../components/PageBase";
import { getDID } from "../storage/didStorage";

/**
 * Home page principale del wallet - Dashboard mobile-optimized
 */
export default function Home() {
  const navigate = useNavigate();
  const [did, setDid] = useState("");
  const [credentialsCount, setCredentialsCount] = useState(0);

  useEffect(() => {
    loadWalletInfo();
  }, []);

  const loadWalletInfo = async () => {
    try {
      const userDid = await getDID();
      setDid(userDid || "");

      // TODO: Caricare numero credenziali dal vcManager
      setCredentialsCount(0);
    } catch (error) {
      console.error("Errore caricamento info wallet:", error);
    }
  };

  const shortDid = did ? `${did.slice(0, 15)}...${did.slice(-8)}` : "Caricamento...";

  const handleCopyDID = async () => {
    if (!did) return;

    try {
      await navigator.clipboard.writeText(did);
      await Toast.show({
        text: "DID copiato negli appunti",
        duration: "short",
        position: "bottom",
      });
    } catch (error) {
      console.error("Errore durante la copia del DID:", error);
      await Toast.show({
        text: "Errore durante la copia",
        duration: "short",
        position: "bottom",
      });
    }
  };

  // Card azioni rapide - ottimizzate per touch
  const QuickActionCard = ({ icon: Icon, title, subtitle, onClick, color = "primary.main" }) => (
    <Card
      onClick={onClick}
      sx={{
        cursor: "pointer",
        transition: "all 0.2s ease",
        height: "100%",
        background:
          "linear-gradient(135deg, rgba(96, 165, 250, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
        border: "1px solid rgba(96, 165, 250, 0.2)",
        "&:active": {
          transform: "scale(0.97)",
        },
        // Feedback visivo per touch
        touchAction: "manipulation",
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          py: 3,
        }}
      >
        <Avatar
          sx={{
            width: 56,
            height: 56,
            mb: 2,
            bgcolor: "transparent",
            border: `2px solid ${color}`,
          }}
        >
          <Icon sx={{ fontSize: 32, color }} />
        </Avatar>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <PageBase title="Il Tuo Wallet">
      {/* Info DID Card */}
      <Card
        sx={{
          mb: 3,
          background:
            "linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
          border: "1px solid rgba(96, 165, 250, 0.3)",
        }}
      >
        <CardContent sx={{ textAlign: "center", py: 3 }}>
          <AccountBalanceWalletIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Il tuo DID
          </Typography>
          <Chip
            label={shortDid}
            icon={<ContentCopyIcon sx={{ fontSize: "1rem" }} />}
            variant="outlined"
            onClick={handleCopyDID}
            sx={{
              fontFamily: "monospace",
              fontSize: "0.8rem",
              maxWidth: "100%",
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: "rgba(96, 165, 250, 0.1)",
              },
              "&:active": {
                transform: "scale(0.97)",
              },
              "& .MuiChip-label": {
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Azioni Rapide - 2x2 grid per mobile */}
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <QuickActionCard
            icon={VerifiedUserIcon}
            title="Credenziali"
            subtitle={`${credentialsCount} salvate`}
            onClick={() => navigate("/credentials")}
            color="primary.main"
          />
        </Grid>

        <Grid item xs={6}>
          <QuickActionCard
            icon={QrCodeScannerIcon}
            title="Scansiona"
            subtitle="Verifica identità"
            onClick={() => navigate("/scan-qr")}
            color="secondary.main"
          />
        </Grid>

        <Grid item xs={6}>
          <QuickActionCard
            icon={AddIcon}
            title="Aggiungi"
            subtitle="Nuova credenziale"
            onClick={() => navigate("/add-credential")}
            color="success.main"
          />
        </Grid>

        <Grid item xs={6}>
          <Card
            sx={{
              height: "100%",
              background:
                "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h3" fontWeight={700} color="success.main">
                {credentialsCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Credenziali attive
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Info Card */}
      <Card
        sx={{
          mt: 3,
          bgcolor: "rgba(96, 165, 250, 0.05)",
          border: "1px solid rgba(96, 165, 250, 0.2)",
        }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            💡 Benvenuto
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Il tuo wallet EBSI è pronto per gestire credenziali verificabili con privacy by design.
            Usa il menu in basso per navigare.
          </Typography>
        </CardContent>
      </Card>
    </PageBase>
  );
}
