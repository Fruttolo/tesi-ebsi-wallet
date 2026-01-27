import {
  Stack,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SettingsIcon from "@mui/icons-material/Settings";
import BackupIcon from "@mui/icons-material/Backup";
import SecurityIcon from "@mui/icons-material/Security";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import InfoIcon from "@mui/icons-material/Info";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PageBase from "../components/PageBase";

/**
 * Pagina impostazioni mobile-optimized
 * Lista touch-friendly con icone e feedback visivo
 */
export default function Settings() {
  const navigate = useNavigate();

  const settingsItems = [
    {
      icon: BackupIcon,
      title: "Backup Seed Phrase",
      subtitle: "Visualizza e salva la tua seed phrase",
      color: "warning.main",
      onClick: () => console.log("APP-EBSI: Backup seed"),
    },
    {
      icon: SecurityIcon,
      title: "Sicurezza",
      subtitle: "PIN, biometria e opzioni di sicurezza",
      color: "error.main",
      onClick: () => console.log("APP-EBSI: Sicurezza"),
    },
    {
      icon: FingerprintIcon,
      title: "Gestione DID",
      subtitle: "Visualizza e gestisci il tuo DID",
      color: "primary.main",
      onClick: () => console.log("APP-EBSI: Gestione DID"),
    },
    {
      icon: InfoIcon,
      title: "Info App",
      subtitle: "Versione e informazioni tecniche",
      color: "info.main",
      onClick: () => console.log("APP-EBSI: Info app"),
    },
  ];

  return (
    <PageBase title="Impostazioni">
      {/* Header icon */}
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Avatar
          sx={{
            width: 80,
            height: 80,
            margin: "0 auto",
            bgcolor: "transparent",
            border: "3px solid",
            borderColor: "primary.main",
          }}
        >
          <SettingsIcon sx={{ fontSize: 48, color: "primary.main" }} />
        </Avatar>
      </Box>

      {/* Settings list - touch friendly */}
      <Card
        sx={{
          background:
            "linear-gradient(135deg, rgba(96, 165, 250, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
          border: "1px solid rgba(96, 165, 250, 0.2)",
        }}
      >
        <List sx={{ p: 0 }}>
          {settingsItems.map((item, index) => (
            <Box key={item.title}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={item.onClick}
                  sx={{
                    py: 2,
                    px: 2.5,
                    "&:active": {
                      bgcolor: "action.selected",
                    },
                  }}
                >
                  <ListItemIcon>
                    <Avatar
                      sx={{
                        bgcolor: "transparent",
                        border: `2px solid ${item.color}`,
                        width: 44,
                        height: 44,
                      }}
                    >
                      <item.icon sx={{ color: item.color, fontSize: 24 }} />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight={600}>
                        {item.title}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {item.subtitle}
                      </Typography>
                    }
                    sx={{ ml: 1 }}
                  />
                  <ChevronRightIcon sx={{ color: "text.secondary" }} />
                </ListItemButton>
              </ListItem>
              {index < settingsItems.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </Card>

      {/* Info footer */}
      <Card
        sx={{
          mt: 3,
          bgcolor: "rgba(96, 165, 250, 0.05)",
          border: "1px solid rgba(96, 165, 250, 0.2)",
        }}
      >
        <CardContent>
          <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
            🚧 Funzionalità in fase di implementazione
          </Typography>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            EBSI Wallet v1.0.0
          </Typography>
        </CardContent>
      </Card>

      {/* Back button */}
      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Button
          variant="outlined"
          size="large"
          onClick={() => navigate("/home")}
          fullWidth
          sx={{
            borderRadius: 3,
            py: 1.5,
          }}
        >
          Torna alla Home
        </Button>
      </Box>
    </PageBase>
  );
}
