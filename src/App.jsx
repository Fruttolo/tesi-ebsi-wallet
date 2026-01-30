import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import MobileLayout from "./components/MobileLayout";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import Onboarding from "./pages/Onboarding";
import { darkTheme } from "./theme/darkTheme";
import WalletChoice from "./pages/WalletChoice";
import WalletSetup from "./pages/WalletSetup";
import ImportWallet from "./pages/ImportWallet";
import Home from "./pages/Home";
import ScanQR from "./pages/ScanQR";
import CameraScanner from "./pages/CameraScanner";
import { AcceptAction } from "./pages/AcceptAction";
import { App as CapacitorApp } from "@capacitor/app";
/* 
import LoadingScreen from "./components/LoadingScreen";
import CredentialsList from "./pages/CredentialsList";
import CredentialOffer from "./pages/CredentialOffer";
import PresentationRequest from "./pages/PresentationRequest";
import AddCredential from "./pages/AddCredential";
import Settings from "./pages/Settings"; */

/**
 * Componente principale dell'app con routing e tema mobile-optimized
 */
export default function App() {
  const navigate = useNavigate();
  const [isFirstTime, setIsFirstTime] = useState(null);
  const [hasWallet, setHasWallet] = useState(null);

  useEffect(() => {
    // Controlla se è il primo accesso
    const onboardingCompleted = localStorage.getItem("onboarding_completed");
    const walletInitialized = localStorage.getItem("wallet_initialized");

    setIsFirstTime(!onboardingCompleted);
    setHasWallet(!!walletInitialized);

    console.log(
      "APP-EBSI: Stato iniziale - isFirstTime:",
      !onboardingCompleted,
      "hasWallet:",
      !!walletInitialized
    );
  }, []);

  useEffect(() => {
    // Listener per deep linking - gestisce apertura app da URI scheme
    let handleAppUrlOpen;

    const setupListener = async () => {
      handleAppUrlOpen = await CapacitorApp.addListener("appUrlOpen", (event) => {
        try {
          const url = event.url;

          // Gestisci Authorization callback (OAuth redirect)
          if (
            url.startsWith("openid-credential-offer://") ||
            url.startsWith("openid4vp://") ||
            url.startsWith("openid://")
          ) {
            navigate("/accept-action", {
              state: {
                uri: url,
                type: "openid-credential-offer",
              },
            });
            return;
          }

          // Naviga a home con messaggio di errore più descrittivo
          navigate("/home", {
            state: {
              error: `QR code non riconosciuto. Ricevuto: ${url.substring(0, 50)}...`,
            },
          });
        } catch (error) {
          console.error("APP-EBSI: ❌ Errore gestione deep link:", error);
          console.error("APP-EBSI: Stack trace:", error.stack);
          // In caso di errore, mostra un alert o naviga a home con messaggio
          navigate("/home", {
            state: {
              error: `Errore nell'apertura del link: ${error.message}`,
            },
          });
        }
      });
    };

    setupListener();

    // Cleanup listener
    return () => {
      if (handleAppUrlOpen) {
        handleAppUrlOpen.remove();
      }
    };
  }, [navigate]);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <MobileLayout>
        <Routes>
          {/* Route principale - redirect basato su stato */}
          <Route
            path="/"
            element={
              isFirstTime === null || hasWallet === null ? (
                <div>Loading...</div>
              ) : isFirstTime ? (
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
          <Route path="/scan-qr" element={<ScanQR />} />
          <Route path="/camera-scanner" element={<CameraScanner />} />
          <Route path="/accept-action" element={<AcceptAction />} />
          {/* <Route path="/credentials" element={<CredentialsList />} />
		  <Route path="/credential-offer" element={<CredentialOffer />} />
		  <Route path="/presentation-request" element={<PresentationRequest />} />
		  <Route path="/add-credential" element={<AddCredential />} />
		  <Route path="/settings" element={<Settings />} /> */}

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MobileLayout>
    </ThemeProvider>
  );
}
