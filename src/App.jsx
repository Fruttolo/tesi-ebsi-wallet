import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { darkTheme } from "./theme/darkTheme";
import { App as CapacitorApp } from "@capacitor/app";
import MobileLayout from "./components/MobileLayout";
import LoadingScreen from "./components/LoadingScreen";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import WalletChoice from "./pages/WalletChoice";
import WalletSetup from "./pages/WalletSetup";
import ImportWallet from "./pages/ImportWallet";
import CredentialsList from "./pages/CredentialsList";
import ScanQR from "./pages/ScanQR";
import CameraScanner from "./pages/CameraScanner";
import CredentialOffer from "./pages/CredentialOffer";
import PresentationRequest from "./pages/PresentationRequest";
import AddCredential from "./pages/AddCredential";
import Settings from "./pages/Settings";

/**
 * Componente principale dell'app con routing e tema mobile-optimized
 */
export default function App() {
  const [isFirstTime, setIsFirstTime] = useState(null);
  const [hasWallet, setHasWallet] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Controlla se è il primo accesso
    const onboardingCompleted = localStorage.getItem("onboarding_completed");
    const walletInitialized = localStorage.getItem("wallet_initialized");

    setIsFirstTime(!onboardingCompleted);
    setHasWallet(!walletInitialized);
  }, []);

  useEffect(() => {
    // Listener per deep linking - gestisce apertura app da URI scheme
    const handleAppUrlOpen = CapacitorApp.addListener("appUrlOpen", (event) => {
      console.log("APP-EBSI: App opened with URL:", event.url);

      try {
        const url = event.url;

        // Gestisci Credential Offering (OpenID4VCI)
        if (url.startsWith("openid-credential-offer://")) {
          handleCredentialOffer(url);
          return;
        }

        // Gestisci Presentation Request (OpenID4VP)
        if (url.startsWith("openid4vp://") || url.startsWith("openid://")) {
          handlePresentationRequest(url);
          return;
        }

        console.warn("Schema URI non riconosciuto:", url);
      } catch (error) {
        console.error("APP-EBSI: Errore gestione deep link:", error);
        // In caso di errore, mostra un alert o naviga a home con messaggio
        navigate("/home", {
          state: {
            error: `Errore nell'apertura del link: ${error.message}`,
          },
        });
      }
    });

    // Cleanup listener
    return () => {
      handleAppUrlOpen.remove();
    };
  }, [navigate]);

  /**
   * Gestisce un Credential Offering secondo OpenID4VCI
   */
  const handleCredentialOffer = async (uri) => {
    console.log("APP-EBSI: 🔗 Deep Link - Credential Offer URI ricevuto:", uri);

    try {
      const url = new URL(uri);
      const credentialOfferUri = url.searchParams.get("credential_offer_uri");
      const credentialOfferParam = url.searchParams.get("credential_offer");

      console.log("APP-EBSI: 📋 Parametri URI:", {
        credential_offer_uri: credentialOfferUri,
        credential_offer: credentialOfferParam ? "presente (inline)" : "assente",
      });

      let credentialOffer;

      // Caso 1: credential_offer_uri - scarica l'offer da un endpoint
      if (credentialOfferUri) {
        console.log("APP-EBSI: 🌐 Scaricamento Credential Offer da:", credentialOfferUri);
        const response = await fetch(credentialOfferUri);
        if (!response.ok) {
          throw new Error(`Errore nel download del credential offer: ${response.statusText}`);
        }
        credentialOffer = await response.json();
      }
      // Caso 2: credential_offer inline - già nell'URI (decodificato)
      else if (credentialOfferParam) {
        console.log("APP-EBSI: 📝 Parsing Credential Offer inline");
        credentialOffer = JSON.parse(decodeURIComponent(credentialOfferParam));
      } else {
        throw new Error("Credential offer non trovato nell'URI");
      }

      console.log("APP-EBSI: ✅ Credential Offer ricevuto:");
      console.log(JSON.stringify(credentialOffer, null, 2));
      console.log("APP-EBSI: 📊 Struttura dell'offer:");
      console.log("APP-EBSI:   - credential_issuer:", credentialOffer.credential_issuer);
      console.log(
        "  - grants:",
        credentialOffer.grants ? Object.keys(credentialOffer.grants) : "none"
      );
      console.log(
        "  - credential_configuration_ids:",
        credentialOffer.credential_configuration_ids
      );
      console.log("APP-EBSI:   - credentials:", credentialOffer.credentials);
      if (credentialOffer.grants?.authorization_code) {
        console.log(
          "  - issuer_state:",
          credentialOffer.grants.authorization_code.issuer_state || "MISSING!"
        );
      }
      console.log("APP-EBSI: 🚀 Navigazione a /credential-offer");

      // Naviga alla pagina di gestione credential offer con i dati
      navigate("/credential-offer", {
        state: {
          credentialOffer,
          sourceUri: uri,
        },
      });
    } catch (error) {
      console.error("APP-EBSI: ❌ Errore gestione Credential Offer:", error);
      // Naviga alla home con messaggio di errore invece che a scan-qr
      navigate("/home", {
        state: {
          error: `Errore nel processamento del credential offer: ${error.message}`,
        },
      });
    }
  };

  /**
   * Gestisce una Presentation Request secondo OpenID4VP
   */
  const handlePresentationRequest = async (uri) => {
    console.log("APP-EBSI: 🔗 Deep Link - Presentation Request URI ricevuto:", uri);
    console.log("APP-EBSI: 🚀 Navigazione a /presentation-request");

    // Naviga alla pagina di gestione presentation request
    navigate("/presentation-request", {
      state: {
        uri,
        type: "openid4vp",
      },
    });
  };

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
          <Route path="/camera-scanner" element={<CameraScanner />} />
          <Route path="/credential-offer" element={<CredentialOffer />} />
          <Route path="/presentation-request" element={<PresentationRequest />} />
          <Route path="/add-credential" element={<AddCredential />} />
          <Route path="/settings" element={<Settings />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MobileLayout>
    </ThemeProvider>
  );
}
