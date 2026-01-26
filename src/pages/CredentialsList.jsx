import { useState, useEffect } from "react";
import {
  Stack,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Box,
  Avatar,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SchoolIcon from "@mui/icons-material/School";
import WorkIcon from "@mui/icons-material/Work";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { vcManager } from "../credentials/vcManager";
import PageBase from "../components/PageBase";

/**
 * Lista credenziali mobile-optimized
 * Stack verticale con card touch-friendly
 */
export default function CredentialsList() {
  const [credentials, setCredentials] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    const creds = await vcManager.getCredentials();
    setCredentials(creds);
  };

  const getCredentialIcon = (type) => {
    if (type.includes("Educational")) return SchoolIcon;
    if (type.includes("Employment")) return WorkIcon;
    return VerifiedUserIcon;
  };

  const getCredentialColor = (type) => {
    if (type.includes("Educational")) return "primary.main";
    if (type.includes("Employment")) return "secondary.main";
    return "success.main";
  };

  const handleViewDetails = (id) => {
    navigate(`/credentials/${id}`);
  };

  // Empty state
  if (credentials.length === 0) {
    return (
      <PageBase title="Le Mie Credenziali">
        <Box
          sx={{
            textAlign: "center",
            py: 8,
          }}
        >
          <VerifiedUserIcon
            sx={{
              fontSize: 80,
              color: "text.disabled",
              mb: 2,
              opacity: 0.3,
            }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nessuna credenziale
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Aggiungi la tua prima credenziale per iniziare
          </Typography>
        </Box>
      </PageBase>
    );
  }

  return (
    <PageBase title="Le Mie Credenziali" subtitle={`${credentials.length} credenziali`}>
      <Stack spacing={2}>
        {credentials.map((credential) => {
          const metadata = vcManager.getMetadata(credential);
          const Icon = getCredentialIcon(metadata.credentialType);
          const color = getCredentialColor(metadata.credentialType);

          return (
            <Card
              key={credential.id}
              sx={{
                background:
                  "linear-gradient(135deg, rgba(96, 165, 250, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
                border: "1px solid rgba(96, 165, 250, 0.2)",
                transition: "all 0.2s ease",
                "&:active": {
                  transform: "scale(0.98)",
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                {/* Header con icona e status */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
                    <Avatar
                      sx={{
                        bgcolor: "transparent",
                        border: `2px solid ${color}`,
                        width: 48,
                        height: 48,
                      }}
                    >
                      <Icon sx={{ color, fontSize: 28 }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          fontSize: "1rem",
                          lineHeight: 1.3,
                          mb: 0.5,
                        }}
                      >
                        {metadata.credentialType}
                      </Typography>
                      <Chip
                        label={metadata.expired ? "Scaduta" : "Valida"}
                        color={metadata.expired ? "error" : "success"}
                        size="small"
                        sx={{ height: 24 }}
                      />
                    </Box>
                  </Box>

                  {/* View button - touch friendly */}
                  <IconButton
                    onClick={() => handleViewDetails(credential.id)}
                    sx={{
                      ml: 1,
                      bgcolor: "action.hover",
                    }}
                    aria-label="Visualizza dettagli"
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                {/* Metadata */}
                <Stack spacing={0.5}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption" color="text.secondary">
                      Issuer
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        maxWidth: "60%",
                        textAlign: "right",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {metadata.issuer}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption" color="text.secondary">
                      Emessa il
                    </Typography>
                    <Typography variant="caption">
                      {new Date(metadata.issuanceDate).toLocaleDateString("it-IT")}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </PageBase>
  );
}
