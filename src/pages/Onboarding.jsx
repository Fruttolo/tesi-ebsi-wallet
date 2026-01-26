import { useState } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Container,
  Card,
  CardContent,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SecurityIcon from "@mui/icons-material/Security";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

const steps = [
  {
    label: "Benvenuto",
    icon: AccountBalanceWalletIcon,
    title: "EUDI Wallet",
    description: "Il tuo portafoglio digitale per identità e credenziali verificabili.",
  },
  {
    label: "Sicurezza",
    icon: SecurityIcon,
    title: "Sicurezza Garantita",
    description:
      "Le tue chiavi sono crittografate e mai condivise. Tu sei l'unico proprietario della tua identità.",
  },
  {
    label: "Privacy",
    icon: VerifiedUserIcon,
    title: "Privacy by Design",
    description:
      "Selective disclosure: condividi solo ciò che vuoi, quando vuoi. I tuoi dati rimangono privati.",
  },
];

/**
 * Pagina di onboarding per il primo utilizzo dell'app
 * @returns {JSX.Element}
 */
export default function Onboarding() {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      // Completa onboarding
      localStorage.setItem("onboarding_completed", "true");
      navigate("/wallet-choice");
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_completed", "true");
    navigate("/wallet-choice");
  };

  const currentStep = steps[activeStep];
  const Icon = currentStep.icon;

  return (
    <Container maxWidth="sm" sx={{ pt: 4 }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }} aria-label="Progresso onboarding">
        {steps.map((step, index) => (
          <Step key={index}>
            <StepLabel>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card sx={{ minHeight: 400, display: "flex", alignItems: "center" }}>
        <CardContent sx={{ textAlign: "center", width: "100%", p: 4 }}>
          <Icon sx={{ fontSize: 80, color: "primary.main", mb: 3 }} aria-hidden="true" />

          <Typography variant="h4" gutterBottom component="h1">
            {currentStep.title}
          </Typography>

          <Typography variant="body1" color="textSecondary" paragraph>
            {currentStep.description}
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <Button
          onClick={handleSkip}
          disabled={activeStep === steps.length - 1}
          aria-label="Salta onboarding"
        >
          Salta
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          aria-label={
            activeStep === steps.length - 1 ? "Inizia ad usare l'app" : "Vai al prossimo step"
          }
        >
          {activeStep === steps.length - 1 ? "Inizia" : "Avanti"}
        </Button>
      </Box>
    </Container>
  );
}
