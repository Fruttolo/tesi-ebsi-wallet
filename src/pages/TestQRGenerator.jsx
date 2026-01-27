import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  Divider,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import QrCodeIcon from "@mui/icons-material/QrCode";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PageBase from "../components/PageBase";

/**
 * Pagina di test per generare QR code da scansionare con l'app
 * Supporta vari tipi di richieste e integrazione con EBSI testnet
 */
export default function TestQRGenerator() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState("verification-request");

  // Esempi di QR code per test
  const qrExamples = {
    "verification-request": {
      label: "Verifica Età",
      icon: <VerifiedUserIcon />,
      color: "primary",
      description: "Richiesta di verifica età senza condivisione dati personali",
      data: {
        type: "verification-request",
        verifier: "https://example-verifier.ebsi.eu",
        verifierId: "did:ebsi:zTestVerifier123",
        requestedAttributes: ["ageOver18"],
        timestamp: new Date().toISOString(),
        nonce: Math.random().toString(36).substring(7),
        challenge: "prove-age-over-18",
      },
    },
    "credential-offer": {
      label: "Offerta Credenziale",
      icon: <CardMembershipIcon />,
      color: "success",
      description: "Offerta di credenziale verificabile da EBSI testnet",
      data: {
        type: "credential-offer",
        issuer: "did:ebsi:zTestIssuer456",
        issuerName: "EBSI Test University",
        issuerUrl: "https://api-pilot.ebsi.eu/trusted-issuers-registry/v4/issuers",
        credentialType: "VerifiableAttestation",
        credentialSubject: {
          type: "AcademicDegree",
          name: "Bachelor of Science in Computer Science",
          issuanceDate: new Date().toISOString(),
          validFrom: new Date().toISOString(),
        },
        credential: {
          "@context": [
            "https://www.w3.org/2018/credentials/v1",
            "https://api-pilot.ebsi.eu/trusted-schemas-registry/v2/schemas",
          ],
          type: ["VerifiableCredential", "VerifiableAttestation"],
          issuer: "did:ebsi:zTestIssuer456",
          credentialSubject: {
            id: "did:ebsi:placeholder",
            degree: {
              type: "BachelorDegree",
              name: "Bachelor of Science in Computer Science",
            },
          },
        },
        timestamp: new Date().toISOString(),
        offerUrl: "https://api-pilot.ebsi.eu/credentials/issue",
      },
    },
    "selective-disclosure": {
      label: "Selective Disclosure",
      icon: <VisibilityIcon />,
      color: "secondary",
      description: "Richiesta con selective disclosure (BBS+)",
      data: {
        type: "selective-disclosure",
        verifier: "did:ebsi:zTestVerifier789",
        verifierName: "EBSI Test Employer",
        requestedFields: ["degree.type", "degree.name", "issuanceDate"],
        optionalFields: ["grade", "honors"],
        timestamp: new Date().toISOString(),
        nonce: Math.random().toString(36).substring(7),
        proofType: "BbsBlsSignature2020",
        challenge: "selective-presentation-challenge",
      },
    },
    "ebsi-testnet": {
      label: "EBSI Testnet Real",
      icon: <QrCodeIcon />,
      color: "info",
      description: "Esempio reale con endpoint EBSI testnet",
      data: {
        type: "credential-offer",
        issuer: "did:ebsi:zXwKrT3ViV1r7N8vK6r9HqL",
        issuerName: "EBSI Conformance Issuer",
        issuerUrl: "https://api-pilot.ebsi.eu/trusted-issuers-registry/v4",
        credentialEndpoint: "https://api-pilot.ebsi.eu/credentials/v1/issue",
        credentialType: "VerifiableAttestation",
        timestamp: new Date().toISOString(),
        preAuthorizedCode: "test-pre-auth-code-123456",
        // Note: questo è un esempio - per usare realmente EBSI testnet
        // bisogna registrarsi e ottenere credenziali valide
        ebsiEnvironment: "pilot",
        note: "Questo è un esempio - richiede registrazione su EBSI testnet",
      },
    },
  };

  const currentExample = qrExamples[selectedType];
  const qrData = JSON.stringify(currentExample.data);

  const handleTypeChange = (event, newType) => {
    if (newType !== null) {
      setSelectedType(newType);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrData);
  };

  return (
    <PageBase title="Test QR Generator">
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <QrCodeIcon
            sx={{
              fontSize: 80,
              color: "primary.main",
              mb: 2,
              filter: "drop-shadow(0 4px 6px rgba(96, 165, 250, 0.3))",
            }}
          />
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Generatore QR Code Test
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Genera QR code per testare la funzionalità di scansione dell'app
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Come usare:</strong> Seleziona un tipo di QR code, poi scansionalo con la pagina{" "}
            <strong>Scansiona QR</strong> dell'app
          </Alert>
        </Box>

        {/* Selector tipo QR */}
        <Box sx={{ mb: 4 }}>
          <ToggleButtonGroup
            value={selectedType}
            exclusive
            onChange={handleTypeChange}
            aria-label="tipo QR code"
            sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}
          >
            {Object.entries(qrExamples).map(([key, example]) => (
              <ToggleButton
                key={key}
                value={key}
                sx={{
                  flex: { xs: "1 1 100%", sm: "1 1 45%" },
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  p: 2,
                }}
              >
                {example.icon}
                <Typography variant="caption">{example.label}</Typography>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {/* QR Code Display */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: "center",
            background: "white",
            borderRadius: 3,
            mb: 3,
          }}
        >
          <Chip
            label={currentExample.label}
            color={currentExample.color}
            icon={currentExample.icon}
            sx={{ mb: 2 }}
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              p: 2,
              backgroundColor: "white",
            }}
          >
            <QRCodeSVG
              value={qrData}
              size={280}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {currentExample.description}
          </Typography>
        </Paper>

        {/* JSON Data Display */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}
            >
              <Typography variant="h6" fontWeight={600}>
                Dati JSON
              </Typography>
              <Button size="small" variant="outlined" onClick={copyToClipboard}>
                Copia JSON
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Paper
              elevation={0}
              sx={{
                p: 2,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                borderRadius: 2,
                maxHeight: 300,
                overflow: "auto",
              }}
            >
              <pre
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "#00ff00",
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {JSON.stringify(currentExample.data, null, 2)}
              </pre>
            </Paper>
          </CardContent>
        </Card>

        {/* Info EBSI Testnet */}
        {selectedType === "ebsi-testnet" && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              ⚠️ Nota per EBSI Testnet
            </Typography>
            <Typography variant="body2" paragraph>
              Per utilizzare realmente le API EBSI testnet sono necessari:
            </Typography>
            <Typography variant="body2" component="div">
              • Registrazione su{" "}
              <a
                href="https://api-pilot.ebsi.eu"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit" }}
              >
                EBSI Pilot
              </a>
            </Typography>
            <Typography variant="body2" component="div">
              • DID registrato su EBSI
            </Typography>
            <Typography variant="body2" component="div">
              • Credenziali di autenticazione valide
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Questo esempio usa dati mockati per testing locale.
            </Typography>
          </Alert>
        )}

        {/* Azioni */}
        <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
          <Button variant="contained" fullWidth onClick={() => navigate("/scan-qr")}>
            Vai a Scansiona QR
          </Button>
          <Button variant="outlined" fullWidth onClick={() => navigate("/home")}>
            Torna alla Home
          </Button>
        </Box>

        {/* Info aggiuntive */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mt: 4,
            background: "rgba(96, 165, 250, 0.05)",
            border: "1px solid rgba(96, 165, 250, 0.2)",
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" fontWeight={600} gutterBottom>
            📱 Come testare
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            1. Apri questa pagina su un computer o tablet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            2. Apri l'app sul tuo telefono Android
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            3. Vai su "Scansiona QR" nell'app
          </Typography>
          <Typography variant="body2" color="text.secondary">
            4. Punta la fotocamera verso il QR code generato
          </Typography>
        </Paper>
      </Container>
    </PageBase>
  );
}
