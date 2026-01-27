import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { darkTheme } from "./theme/darkTheme";
import MobileLayout from "./components/MobileLayout";
import LoadingScreen from "./components/LoadingScreen";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import WalletChoice from "./pages/WalletChoice";
import WalletSetup from "./pages/WalletSetup";
import ImportWallet from "./pages/ImportWallet";
import CredentialsList from "./pages/CredentialsList";
import ScanQR from "./pages/ScanQR";
import AddCredential from "./pages/AddCredential";
import Settings from "./pages/Settings";

/**
 * Componente principale dell'app con routing e tema mobile-optimized
 */
export default function App() {
  const [isFirstTime, setIsFirstTime] = useState(null);
  const [hasWallet, setHasWallet] = useState(null);

  useEffect(() => {
    // Controlla se è il primo accesso
    const onboardingCompleted = localStorage.getItem("onboarding_completed");
    const walletInitialized = localStorage.getItem("wallet_initialized");

    setIsFirstTime(!onboardingCompleted);
    setHasWallet(!walletInitialized);
  }, []);

  // Loading state
  if (isFirstTime === null || hasWallet === null) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <LoadingScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <MobileLayout>
        <Routes>
          {/* Route principale - redirect basato su stato */}
          <Route
            path="/"
            element={
              isFirstTime ? (
                <Navigate to="/onboarding" replace />
              ) : !hasWallet ? (
                <Navigate to="/wallet-choice" replace />
              ) : (
                <Navigate to="/home" replace />
              )
            }
          />

          {/* Onboarding */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Setup wallet */}
          <Route path="/wallet-choice" element={<WalletChoice />} />
          <Route path="/wallet-setup" element={<WalletSetup />} />
          <Route path="/import-wallet" element={<ImportWallet />} />

          {/* App principale */}
          <Route path="/home" element={<Home />} />
          <Route path="/credentials" element={<CredentialsList />} />
          <Route path="/scan-qr" element={<ScanQR />} />
          <Route path="/add-credential" element={<AddCredential />} />
          <Route path="/settings" element={<Settings />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MobileLayout>
    </ThemeProvider>
  );
}
