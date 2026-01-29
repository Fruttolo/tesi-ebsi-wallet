import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  TextField,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import PageBase from "../components/PageBase";
import { getDIDDocument } from "../identity/didManager";
import { createIDToken, createProofJWT } from "../crypto/jwtUtils";
import { saveCredential } from "../storage/credentialStorage";
import { generateCodeVerifier, generateCodeChallenge, generateRandomString } from "../utils/pkce";
import { CapacitorHttp } from "@capacitor/core";

/**
 * Pagina per gestire Credential Offering secondo OpenID4VCI
 * Riferimento: EBSI Wallet Conformance Guidelines
 * https://api-conformance.ebsi.eu/docs/wallet-conformance
 */
export default function CredentialOffer() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    credentialOffer,
    sourceUri,
    authCode,
    authState: incomingState,
    authError,
    idTokenRequest, // Nuovo: richiesta ID Token dall'authorization server
  } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [issuerMetadata, setIssuerMetadata] = useState(null);
  const [authServerMetadata, setAuthServerMetadata] = useState(null);
  const [pin, setPin] = useState("");
  const [requiresPin, setRequiresPin] = useState(false);
  const [authState, setAuthState] = useState(null); // Per Authorization Code Flow

  useEffect(() => {
    console.log("APP-EBSI: CredentialOffer mounted");
    console.log("APP-EBSI: location.state:", JSON.stringify(location.state, null, 2));

    // Se stiamo processando un callback, non mostrare errori
    const isProcessingCallback = idTokenRequest || authCode;

    if (authError && !isProcessingCallback) {
      console.log("APP-EBSI: ❌ Auth error presente:", authError);
      setError(`Errore di autorizzazione: ${authError}`);
      return;
    }

    if (!credentialOffer && !isProcessingCallback) {
      console.error("APP-EBSI: ❌ Credential offer mancante");
      console.error("APP-EBSI: 📊 State ricevuto:", location.state);
      console.error(
        "APP-EBSI: 📋 Chiavi disponibili:",
        location.state ? Object.keys(location.state) : "nessuna"
      );
      setError("Nessun credential offer fornito");
      return;
    }

    // Se stiamo processando un callback, non avviare il discovery
    if (isProcessingCallback) {
      console.log("APP-EBSI: ⏳ Processing callback, skip discovery");
      return;
    }

    console.log("APP-EBSI: ✅ Credential offer presente, avvio discovery");
    // Avvia il discovery
    discoverMetadata();
  }, [credentialOffer, authError, idTokenRequest, authCode]);

  // Gestisci il ritorno dall'authorization flow
  useEffect(() => {
    const handleAuthCallback = async () => {
      // Caso 1: ID Token Request dall'authorization server
      if (idTokenRequest) {
        console.log("APP-EBSI: 🆔 Processing ID Token Request");
        const savedState = sessionStorage.getItem("authState");
        if (savedState) {
          try {
            const authStateData = JSON.parse(savedState);
            await handleIDTokenRequest(idTokenRequest, authStateData);
          } catch (err) {
            console.error("APP-EBSI: Errore nel processing dell'ID Token Request:", err);
            setError(err.message);
          }
        } else {
          setError("Auth state non trovato - riprova il flusso");
        }
        return;
      }

      // Caso 2: Authorization Response con code
      if (authCode && incomingState) {
        console.log("APP-EBSI: 🔄 Processing authorization callback from deep link");

        const savedState = sessionStorage.getItem("authState");
        if (savedState) {
          try {
            const authStateData = JSON.parse(savedState);
            if (authStateData.state === incomingState) {
              await exchangeCodeForToken(authCode, authStateData);
            } else {
              setError("State mismatch - possibile attacco CSRF");
            }
          } catch (err) {
            console.error("APP-EBSI: Errore nel processing del callback:", err);
            setError(err.message);
          }
        }
      }
    };

    handleAuthCallback();
  }, [authCode, incomingState, idTokenRequest]);

  /**
   * Step 1: Discovery delle configurazioni Issuer e Authorization Server
   */
  const discoverMetadata = async () => {
    setLoading(true);
    setError("");

    try {
      const { credential_issuer } = credentialOffer;

      if (!credential_issuer) {
        throw new Error("credential_issuer mancante nel credential offer");
      }

      console.log("APP-EBSI: 🔍 Discovery da:", credential_issuer);

      // 1. Scarica OpenID Credential Issuer Metadata
      const issuerMetadataUrl = `${credential_issuer}/.well-known/openid-credential-issuer`;
      console.log("APP-EBSI: 📡 Fetching issuer metadata:", issuerMetadataUrl);

      const issuerResponse = await fetch(issuerMetadataUrl);
      if (!issuerResponse.ok) {
        throw new Error(
          `Errore nel download dei metadata dell'issuer: ${issuerResponse.statusText}`
        );
      }
      const issuerMeta = await issuerResponse.json();
      setIssuerMetadata(issuerMeta);
      console.log("APP-EBSI: Issuer Metadata:", issuerMeta);

      // 2. Scarica OpenID Authorization Server Metadata
      const authServer = issuerMeta.authorization_server || issuerMeta.authorization_servers?.[0];
      if (!authServer) {
        throw new Error("Authorization server non trovato nei metadata dell'issuer");
      }

      const authMetadataUrl = `${authServer}/.well-known/openid-configuration`;
      console.log("APP-EBSI: Fetching auth server metadata:", authMetadataUrl);

      const authResponse = await fetch(authMetadataUrl);
      if (!authResponse.ok) {
        throw new Error(
          `Errore nel download dei metadata dell'auth server: ${authResponse.statusText}`
        );
      }
      const authMeta = await authResponse.json();
      setAuthServerMetadata(authMeta);
      console.log("APP-EBSI: Auth Server Metadata:", authMeta);

      // VALIDAZIONE: Verifica che i credential types nell'offer siano supportati dall'issuer
      if (issuerMeta.credentials_supported) {
        console.log("APP-EBSI: 🔎 Validazione credential types...");
        const offeredItems =
          credentialOffer.credential_configuration_ids || credentialOffer.credentials;
        console.log("APP-EBSI:   Offerti nell'offer:", offeredItems);

        // Estrai i types dagli item offerti
        // Possono essere: string IDs, oggetti con types, o array di types
        const offeredTypes = offeredItems.flatMap((item) => {
          if (typeof item === "string") {
            return [item]; // ID semplice
          } else if (item?.types && Array.isArray(item.types)) {
            return item.types; // Oggetto con array types
          } else if (Array.isArray(item)) {
            return item; // È già un array
          }
          return [];
        });
        console.log("APP-EBSI:   Types estratti dall'offer:", offeredTypes);

        // Estrai i types supportati dall'issuer
        // credentials_supported contiene oggetti con types array o id
        const supportedTypesList = issuerMeta.credentials_supported.map((c) => {
          if (c.types && Array.isArray(c.types)) {
            return c.types; // Array di types
          } else if (c.id) {
            return [c.id]; // ID come array singolo
          }
          return [];
        });

        // Flatten per avere una lista piatta di tutti i types supportati
        const allSupportedTypes = supportedTypesList.flat();
        console.log("APP-EBSI:   Types supportati dall'issuer (flattened):", allSupportedTypes);

        // Verifica che almeno uno dei credential types nell'offer sia supportato
        const hasMatch = offeredTypes.some((offeredType) =>
          allSupportedTypes.includes(offeredType)
        );

        // Oppure verifica se esiste una configurazione che matcha tutti i types offerti
        const hasExactMatch = supportedTypesList.some((supportedTypes) =>
          offeredTypes.every((offeredType) => supportedTypes.includes(offeredType))
        );

        console.log("APP-EBSI:   Ha match parziale:", hasMatch);
        console.log("APP-EBSI:   Ha match esatto:", hasExactMatch);

        if (!hasMatch && !hasExactMatch) {
          console.warn("⚠️ ATTENZIONE: Nessun credential type corrispondente trovato!");
          console.warn("   Questo potrebbe causare errori durante l'authorization.");
          console.warn("   Offerti:", offeredTypes);
          console.warn("   Supportati:", allSupportedTypes);
        } else {
          console.log("APP-EBSI: ✅ Credential types validati correttamente");
        }
      }

      // 3. Verifica se è pre-authorized o richiede autorizzazione
      const grants = credentialOffer.grants;
      if (grants?.["urn:ietf:params:oauth:grant-type:pre-authorized_code"]) {
        const preAuthGrant = grants["urn:ietf:params:oauth:grant-type:pre-authorized_code"];
        // Controlla se richiede PIN
        if (preAuthGrant.user_pin_required === true) {
          setRequiresPin(true);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("APP-EBSI: Errore discovery:", err);
      setError(err.message || "Errore durante il discovery");
      setLoading(false);
    }
  };

  /**
   * Step 2: Avvia il flusso di autorizzazione appropriato
   */
  const acceptOffer = async () => {
    setLoading(true);
    setError("");

    try {
      const grants = credentialOffer.grants;

      // Caso 1: Pre-Authorized Flow
      if (grants?.["urn:ietf:params:oauth:grant-type:pre-authorized_code"]) {
        await handlePreAuthorizedFlow();
      }
      // Caso 2: Authorization Code Flow
      else if (grants?.authorization_code) {
        await handleAuthorizationCodeFlow();
      } else {
        throw new Error("Tipo di grant non supportato");
      }
    } catch (err) {
      console.error("APP-EBSI: Errore nell'accettazione dell'offer:", err);
      setError(err.message || "Errore nell'accettazione dell'offer");
      setLoading(false);
    }
  };

  /**
   * Gestisce il Pre-Authorized Flow
   */
  const handlePreAuthorizedFlow = async () => {
    console.log("APP-EBSI: Avvio Pre-Authorized Flow");

    try {
      const preAuthGrant =
        credentialOffer.grants["urn:ietf:params:oauth:grant-type:pre-authorized_code"];
      const preAuthorizedCode = preAuthGrant["pre-authorized_code"];

      if (!preAuthorizedCode) {
        throw new Error("pre-authorized_code mancante");
      }

      // Verifica PIN se richiesto
      if (requiresPin && !pin) {
        throw new Error("PIN richiesto ma non fornito");
      }

      // Richiedi access token
      const tokenEndpoint = authServerMetadata.token_endpoint;
      const tokenParams = new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:pre-authorized_code",
        "pre-authorized_code": preAuthorizedCode,
      });

      if (requiresPin && pin) {
        tokenParams.append("user_pin", pin);
      }

      console.log("APP-EBSI: Token request:", tokenEndpoint, tokenParams.toString());

      const tokenResponse = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: tokenParams.toString(),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error_description || `Errore token request: ${tokenResponse.statusText}`
        );
      }

      const tokenData = await tokenResponse.json();
      console.log("APP-EBSI: Token response:", tokenData);

      // Crea un oggetto authStateData per passare i metadati necessari
      const authStateData = {
        credentialOffer,
        issuerMetadata,
      };

      // Procedi con la richiesta della credenziale
      await requestCredential(tokenData, authStateData);
    } catch (err) {
      throw err;
    }
  };

  /**
   * Gestisce l'Authorization Code Flow con ID Token authentication
   */
  const handleAuthorizationCodeFlow = async () => {
    console.log("APP-EBSI: Avvio Authorization Code Flow");

    try {
      // Recupera il DID del wallet
      const didDocument = await getDIDDocument();
      if (!didDocument || !didDocument.id) {
        throw new Error("DID del wallet non trovato. Configura prima un'identità.");
      }
      const holderDid = didDocument.id;

      // 1. Genera PKCE parameters
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateRandomString();

      // Salva lo state per il callback
      const authStateData = {
        codeVerifier,
        state,
        credentialOffer,
        issuerMetadata,
        authServerMetadata,
      };
      setAuthState(authStateData);
      sessionStorage.setItem("authState", JSON.stringify(authStateData));

      // 2. Costruisci Authorization Request
      const authEndpoint = authServerMetadata.authorization_endpoint;
      const redirectUri = "openid://";

      // Prepara authorization_details per specificare le credenziali richieste
      const authorizationDetails = credentialOffer.credentials.map((cred) => {
        const detail = {
          type: "openid_credential",
          format: cred.format || "jwt_vc",
          types: cred.types,
        };

        // Aggiungi location se specificato (credential_issuer)
        if (credentialOffer.credential_issuer) {
          detail.locations = [credentialOffer.credential_issuer];
        }

        return detail;
      });

      console.log(
        "APP-EBSI: 📋 Authorization details:",
        JSON.stringify(authorizationDetails, null, 2)
      );

      const authParams = new URLSearchParams({
        response_type: "code",
        client_id: holderDid,
        redirect_uri: redirectUri,
        scope: "openid",
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        authorization_details: JSON.stringify(authorizationDetails),
      });

      // Aggiungi issuer_state se presente nel grant (OBBLIGATORIO per EBSI)
      const authCodeGrant = credentialOffer.grants?.authorization_code;
      if (authCodeGrant?.issuer_state) {
        authParams.append("issuer_state", authCodeGrant.issuer_state);
        console.log("APP-EBSI: ✅ Issuer state aggiunto:", authCodeGrant.issuer_state);
      } else {
        console.warn("⚠️ Nessun issuer_state trovato nel grant!");
        console.log(
          "APP-EBSI: Grants disponibili:",
          JSON.stringify(credentialOffer.grants, null, 2)
        );
      }

      console.log("APP-EBSI: 📤 Authorization Request Parameters:");
      console.log("APP-EBSI:   - response_type:", "code");
      console.log("APP-EBSI:   - client_id:", holderDid);
      console.log("APP-EBSI:   - redirect_uri:", redirectUri);
      console.log("APP-EBSI:   - scope:", "openid");
      console.log("APP-EBSI:   - state:", state);
      console.log("APP-EBSI:   - code_challenge:", codeChallenge.substring(0, 20) + "...");
      console.log("APP-EBSI:   - issuer_state:", authCodeGrant?.issuer_state || "MISSING");
      console.log("APP-EBSI:   - authorization_details:", JSON.stringify(authorizationDetails));

      const authUrl = `${authEndpoint}?${authParams.toString()}`;
      console.log("APP-EBSI: Authorization Request URL:", authUrl);

      // 3. Apri il browser per la richiesta di autorizzazione
      // Il flusso continuerà quando l'app riceverà il redirect via deep link
      //console.log("APP-EBSI: 🌐 Apertura browser per authorization...");
      //await Browser.open({ url: authUrl });

      // 3. Prova a fare il fetch con capacitorHttp diretto in app (senza aprire il browser)
      console.log("APP-EBSI: 🌐 Apertura authorization URL in app...");
      const response = await CapacitorHttp.get({ url: authUrl });

      if (response.status != 302 || !response.headers["Location"]) {
        throw new Error(`Errore nell'apertura dell'authorization URL: ${response.status}`);
      }

      if (!response.headers["Location"].startsWith("openid://")) {
        throw new Error("Redirect URI non valido ricevuto dall'authorization server");
      }

      console.log("APP-EBSI: 📥 Authorization response status:", response);

      // Nota: Il flusso continuerà tramite deep link handler in App.jsx
      // che chiamerà handleAuthorizationCallback con i parametri del redirect
      console.log("APP-EBSI: ⏳ In attesa del redirect dall'authorization server...");

      const uri = response.headers["Location"];

      try {
        const url = new URL(uri);
        const responseType = url.searchParams.get("response_type");
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");
        const errorDescription = url.searchParams.get("error_description");

        // Gestisci errori
        if (error) {
          console.error("APP-EBSI: ❌ Authorization error:", error, errorDescription);
          navigate("/credential-offer", {
            state: {
              authError: errorDescription || error,
            },
          });
          return;
        }

        // Caso 1: ID Token Request dall'authorization server
        if (responseType === "id_token") {
          console.log("APP-EBSI: 🆔 ID Token Request ricevuto dall'authorization server");
          const clientId = url.searchParams.get("client_id");
          const nonce = url.searchParams.get("nonce");
          const redirectUri = url.searchParams.get("redirect_uri");
          const requestUri = url.searchParams.get("request_uri");

          console.log("APP-EBSI: 📋 ID Token Request params:");
          console.log("APP-EBSI:   - client_id:", clientId);
          console.log("APP-EBSI:   - nonce:", nonce);
          console.log("APP-EBSI:   - redirect_uri:", redirectUri);
          console.log("APP-EBSI:   - state:", state);
          console.log("APP-EBSI:   - request_uri:", requestUri || "N/A");

          // Naviga alla pagina credential offer con i parametri dell'ID Token Request
          navigate("/credential-offer", {
            state: {
              idTokenRequest: {
                clientId,
                nonce,
                redirectUri,
                state,
                requestUri,
              },
            },
          });
          return;
        }

        // Caso 2: Authorization Response con code
        if (code && state) {
          console.log("APP-EBSI: ✅ Authorization code ricevuto");
          console.log("APP-EBSI:   - code:", code.substring(0, 20) + "...");
          console.log("APP-EBSI:   - state:", state);

          // Naviga alla pagina credential offer con i parametri del callback
          navigate("/credential-offer", {
            state: {
              authCode: code,
              authState: state,
            },
          });
          return;
        }

        // Nessun parametro riconosciuto
        throw new Error(
          `Callback non riconosciuto. response_type: ${responseType}, code: ${code ? "presente" : "assente"}`
        );
      } catch (error) {
        console.error("APP-EBSI: ❌ Errore gestione authorization callback:", error);
        navigate("/home", {
          state: {
            error: `Errore nel callback di autorizzazione: ${error.message}`,
          },
        });
      }
    } catch (err) {
      console.error("APP-EBSI: ❌ Errore nel Authorization Code Flow:", err);
      throw err;
    }
  };

  /**
   * Gestisce un ID Token Request dall'Authorization Server
   * L'auth server richiede un ID Token per autenticare il DID del wallet
   */
  const handleIDTokenRequest = async (idTokenRequest, authStateData) => {
    console.log("APP-EBSI: 🆔 Gestione ID Token Request");
    console.log("APP-EBSI: ID Token Request params:", idTokenRequest);

    try {
      setLoading(true);
      setError("");

      // Recupera il DID del wallet
      const didDocument = await getDIDDocument();
      if (!didDocument || !didDocument.id) {
        throw new Error("DID del wallet non trovato");
      }
      const holderDid = didDocument.id;

      const { clientId, nonce, redirectUri, state, requestUri } = idTokenRequest;

      // Se presente request_uri, scarica i parametri della richiesta
      if (requestUri) {
        console.log("APP-EBSI: 📥 Scaricamento parametri da request_uri:", requestUri);
        try {
          const requestResponse = await fetch(requestUri);
          if (requestResponse.ok) {
            const requestParams = await requestResponse.text();
            console.log("APP-EBSI: 📋 Request params:", requestParams);
            // I parametri aggiuntivi potrebbero essere in formato JWT o JSON
            // Per ora logghiamoli per debug
          }
        } catch (e) {
          console.warn("APP-EBSI: ⚠️ Impossibile scaricare request_uri:", e.message);
        }
      }

      // Crea ID Token firmato con il DID del wallet
      console.log("APP-EBSI: 🔐 Creazione ID Token...");
      console.log("APP-EBSI:   - iss (holder DID):", holderDid);
      console.log("APP-EBSI:   - aud (client_id):", clientId);
      console.log("APP-EBSI:   - nonce:", nonce);
      console.log("APP-EBSI:   - DID document:", didDocument);

      // Chiama createIDToken con i parametri corretti (issuerDid, audience, nonce)
      const idToken = await createIDToken(holderDid, clientId, nonce);

      console.log("APP-EBSI: ✅ ID Token creato");
      console.log("APP-EBSI: 🔍 ID Token (full):", idToken);

      // Decodifica per debug
      try {
        const parts = idToken.split(".");
        const header = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")));
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        console.log("APP-EBSI: 📋 ID Token Header:", header);
        console.log("APP-EBSI: 📋 ID Token Payload:", payload);
        console.log("APP-EBSI: 📋 Signature length (base64url):", parts[2].length);
      } catch (e) {
        console.warn("APP-EBSI: ⚠️ Impossibile decodificare ID Token per debug:", e);
      }

      // Prepara ID Token Response per direct_post
      const idTokenResponse = new URLSearchParams({
        id_token: idToken,
      });

      // Aggiungi state se presente nella richiesta
      if (state) {
        idTokenResponse.append("state", state);
        console.log("APP-EBSI: ✅ State aggiunto alla response:", state);
      }

      console.log("APP-EBSI: 📤 Invio ID Token Response a:", redirectUri);
      console.log("APP-EBSI: 📋 ID Token Response params:", idTokenResponse.toString());

      // Invia ID Token Response tramite direct_post con capacitorHttp
      // NOTA: CapacitorHttp potrebbe seguire automaticamente i redirect
      const response = await CapacitorHttp.post({
        url: redirectUri,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: idTokenResponse.toString(),
      });

      console.log("APP-EBSI: 📥 Direct Post response:", {
        status: response.status,
        headers: response.headers,
        data: typeof response.data === "string" ? response.data.substring(0, 200) : response.data,
      });

      // Gestione della risposta
      if (response.status >= 400) {
        const errorText =
          typeof response.data === "string" ? response.data : JSON.stringify(response.data);
        throw new Error(`Errore nell'invio dell'ID Token: ${response.status} - ${errorText}`);
      }

      // Estrai il redirect URL dalla risposta
      let redirectUrl = null;

      // Caso 1: Redirect esplicito (302, 303, 307)
      if ([302, 303, 307].includes(response.status)) {
        // Gli headers potrebbero essere lowercase o avere il case originale
        redirectUrl = response.headers.location || response.headers.Location;
        if (redirectUrl) {
          console.log(`APP-EBSI: 📥 Location header (redirect ${response.status}):`, redirectUrl);
        } else {
          console.warn(`APP-EBSI: ⚠️ Status ${response.status} ma Location header mancante`);
          console.log("APP-EBSI: Headers disponibili:", Object.keys(response.headers));
        }
      }

      // Caso 2: Risposta 200 con redirect_uri nel body
      if (!redirectUrl && response.data) {
        // Se c'è un body, proviamo a parsarlo
        try {
          const responseData =
            typeof response.data === "string" ? JSON.parse(response.data) : response.data;
          console.log("APP-EBSI: 📥 Risposta da direct_post:", responseData);

          if (responseData.redirect_uri) {
            redirectUrl = responseData.redirect_uri;
            console.log("APP-EBSI: 📥 Redirect URI dal body:", redirectUrl);
          }
        } catch (e) {
          console.warn("APP-EBSI: ⚠️ Impossibile parsare response.data come JSON");
        }
      }

      // Caso 3: CapacitorHttp ha seguito automaticamente il redirect
      // In questo caso response.url conterrà l'URL finale dopo i redirect
      if (!redirectUrl && response.url && response.url !== redirectUri) {
        redirectUrl = response.url;
        console.log("APP-EBSI: 📥 Redirect automatico seguito, URL finale:", redirectUrl);
      }

      // Se abbiamo un redirect URL, processalo
      if (redirectUrl) {
        console.log("APP-EBSI: 📥 Redirect URI ricevuto:", redirectUrl);

        // Verifica se il redirect contiene un errore
        if (redirectUrl.includes("error=")) {
          // Parse error from redirect URL
          try {
            const urlObj = new URL(redirectUrl);
            const error = urlObj.searchParams.get("error");
            const errorDescription = decodeURIComponent(
              urlObj.searchParams.get("error_description") || ""
            );

            console.error("APP-EBSI: ❌ Errore dal direct_post:");
            console.error("  - error:", error);
            console.error("  - error_description:", errorDescription);

            throw new Error(`Auth Server error: ${errorDescription || error}`);
          } catch (e) {
            if (e.message.startsWith("Auth Server error:")) {
              throw e;
            }
            throw new Error(`Errore nel redirect URL: ${redirectUrl}`);
          }
        }

        console.log("APP-EBSI: ✅ ID Token accettato, redirect a:", redirectUrl);
        console.log("APP-EBSI: 🔄 Elaborazione redirect URL internamente");

        let redirectHandled = false;

        try {
          const redirectUrlObj = new URL(redirectUrl);
          const responseType = redirectUrlObj.searchParams.get("response_type");

          if (responseType === "id_token") {
            const clientId = redirectUrlObj.searchParams.get("client_id");
            const nonce = redirectUrlObj.searchParams.get("nonce");
            const nextRedirectUri = redirectUrlObj.searchParams.get("redirect_uri");
            const redirectStateParam = redirectUrlObj.searchParams.get("state");
            const requestUri = redirectUrlObj.searchParams.get("request_uri");

            console.log("APP-EBSI: 📋 Redirect richiede nuovo ID Token:");
            console.log("  - client_id:", clientId);
            console.log("  - nonce:", nonce);
            console.log("  - redirect_uri:", nextRedirectUri);
            console.log("  - state:", redirectStateParam);
            console.log("  - request_uri:", requestUri || "N/A");

            navigate("/credential-offer", {
              state: {
                idTokenRequest: {
                  clientId,
                  nonce,
                  redirectUri: nextRedirectUri,
                  state: redirectStateParam,
                  requestUri,
                },
              },
            });

            redirectHandled = true;
          }

          if (!redirectHandled) {
            const code = redirectUrlObj.searchParams.get("code");
            const redirectStateParam = redirectUrlObj.searchParams.get("state");

            if (code && redirectStateParam) {
              console.log("APP-EBSI: 📥 Authorization code rilevato dal redirect");
              console.log("  - code:", code.substring(0, 20) + "...");
              console.log("  - state:", redirectStateParam);

              navigate("/credential-offer", {
                state: {
                  authCode: code,
                  authState: redirectStateParam,
                },
              });

              redirectHandled = true;
            }
          }
        } catch (parseError) {
          console.error("APP-EBSI: ❌ Redirect URI non valido:", redirectUrl);
          throw new Error(`Redirect URI non valido: ${redirectUrl}`);
        }

        if (!redirectHandled) {
          throw new Error("Redirect URI ricevuto ma nessun parametro gestibile trovato");
        }
      } else {
        throw new Error("Nessun redirect_uri nella risposta dal direct_post");
      }

      setLoading(false);
    } catch (err) {
      console.error("APP-EBSI: ❌ Errore nella gestione dell'ID Token Request:", err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  /**
   * Gestisce la risposta dall'Authorization Server (ID Token Request)
   */
  const handleAuthorizationResponse = async (
    authResponse,
    authStateData,
    holderDid,
    redirectUri
  ) => {
    try {
      // L'Auth Server risponde con un redirect che contiene l'ID Token Request
      // In un ambiente reale, questo sarebbe gestito tramite deep link
      // Per ora, estraiamo i parametri dalla Location header o dal body

      let idTokenRequestParams;

      // Verifica se c'è un redirect (status 302/303)
      if (authResponse.status === 302 || authResponse.status === 303) {
        const locationHeader = authResponse.headers.get("Location");
        if (locationHeader) {
          console.log("APP-EBSI: 📍 Redirect Location:", locationHeader);
          const url = new URL(locationHeader);
          idTokenRequestParams = Object.fromEntries(url.searchParams);

          // CONTROLLA SE C'È UN ERRORE NEL REDIRECT
          if (idTokenRequestParams.error) {
            const errorMsg = decodeURIComponent(
              idTokenRequestParams.error_description || idTokenRequestParams.error
            );
            console.error("APP-EBSI: ❌ Errore OAuth nel redirect:", errorMsg);
            throw new Error(`Authorization error: ${errorMsg}`);
          }
        }
      } else if (authResponse.ok) {
        // Oppure potrebbe essere nel body come JSON
        idTokenRequestParams = await authResponse.json();

        // Controlla errori anche nel body
        if (idTokenRequestParams.error) {
          const errorMsg = idTokenRequestParams.error_description || idTokenRequestParams.error;
          console.error("APP-EBSI: ❌ Errore OAuth nel body:", errorMsg);
          throw new Error(`Authorization error: ${errorMsg}`);
        }
      } else {
        // Tenta di leggere il body per maggiori dettagli sull'errore
        let errorDetails = authResponse.statusText;
        try {
          const errorBody = await authResponse.text();
          console.error("APP-EBSI: ❌ Authorization Response Error Body:", errorBody);

          // Prova a parsare come JSON
          try {
            const errorJson = JSON.parse(errorBody);
            if (errorJson.error) {
              errorDetails = errorJson.error_description || errorJson.error;
            } else if (errorJson.message) {
              errorDetails = errorJson.message;
            } else {
              errorDetails = errorBody;
            }
          } catch {
            // Non è JSON, usa il testo raw
            errorDetails = errorBody || errorDetails;
          }
        } catch (e) {
          console.error("APP-EBSI: ❌ Impossibile leggere error body:", e);
        }

        throw new Error(
          `Errore nella authorization request (${authResponse.status}): ${errorDetails}`
        );
      }

      console.log("APP-EBSI: 📨 ID Token Request params:", idTokenRequestParams);

      // Estrai i parametri necessari per l'ID Token
      const {
        scope,
        nonce,
        state: responseState,
        redirect_uri: responseRedirectUri,
        response_mode,
      } = idTokenRequestParams;

      // Verifica che lo state corrisponda
      if (responseState && responseState !== authStateData.state) {
        throw new Error("State mismatch - possibile attacco CSRF");
      }

      // Crea ID Token per autenticare il DID
      const idToken = await createIDToken(
        holderDid,
        responseRedirectUri ||
          redirect_uri ||
          authStateData.authServerMetadata.authorization_endpoint,
        nonce
      );

      console.log("APP-EBSI: ID Token creato per authentication");

      // Invia l'ID Token Response via direct_post
      await sendIDTokenResponse(
        idToken,
        responseRedirectUri || redirectUri,
        responseState,
        authStateData,
        response_mode
      );
    } catch (err) {
      throw err;
    }
  };

  /**
   * Invia l'ID Token Response tramite direct_post
   */
  const sendIDTokenResponse = async (idToken, redirectUri, state, authStateData, responseMode) => {
    try {
      console.log("APP-EBSI: Invio ID Token Response a:", redirectUri);

      const responseBody = new URLSearchParams({
        id_token: idToken,
      });

      if (state) {
        responseBody.append("state", state);
      }

      // Invia la risposta tramite POST (direct_post mode)
      // redirect: 'manual' per gestire i 302 redirect manualmente
      const response = await fetch(redirectUri, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: responseBody.toString(),
        redirect: "manual",
      });

      // Gestisci redirect 302
      if (response.type === "opaqueredirect" || response.status === 302) {
        const locationHeader = response.headers.get("Location");
        if (locationHeader) {
          console.log("APP-EBSI: Redirect ricevuto verso:", locationHeader);
          // Segui il redirect manualmente
          const redirectResponse = await fetch(locationHeader, {
            method: "GET",
            redirect: "manual",
          });
          const authCodeResponse = await redirectResponse.json();
          console.log("APP-EBSI: Authorization Code Response:", authCodeResponse);

          const { code, state: codeState } = authCodeResponse;
          if (!code) {
            throw new Error("Authorization code non ricevuto");
          }
          if (codeState && codeState !== authStateData.state) {
            throw new Error("State mismatch nella authorization response");
          }
          await exchangeCodeForToken(code, authStateData);
          return;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error_description || `Errore ID Token Response: ${response.statusText}`
        );
      }

      // L'Auth Server risponde con un redirect contenente il code
      const authCodeResponse = await response.json();
      console.log("APP-EBSI: Authorization Code Response:", authCodeResponse);

      // Estrai il code dalla risposta
      const { code, state: codeState, redirect_uri: finalRedirectUri } = authCodeResponse;

      if (!code) {
        throw new Error("Authorization code non ricevuto");
      }

      // Verifica lo state se presente
      if (codeState && codeState !== authStateData.state) {
        throw new Error("State mismatch nella authorization response");
      }

      // Procedi con il token exchange
      await exchangeCodeForToken(code, authStateData);
    } catch (err) {
      throw err;
    }
  };

  /**
   * Scambia l'authorization code per un access token
   */
  const exchangeCodeForToken = async (code, authStateData) => {
    try {
      console.log("APP-EBSI: Exchange authorization code per access token");

      // Recupera il DID del wallet per usarlo come client_id
      const didDocument = await getDIDDocument();
      if (!didDocument || !didDocument.id) {
        throw new Error("DID del wallet non trovato");
      }
      const holderDid = didDocument.id;

      const tokenEndpoint = authStateData.authServerMetadata.token_endpoint;
      const redirectUri = "openid://";

      const tokenParams = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
        code_verifier: authStateData.codeVerifier,
        client_id: holderDid,
      });

      console.log("APP-EBSI: Token request to:", tokenEndpoint);
      console.log("APP-EBSI: Token request params:", {
        grant_type: "authorization_code",
        client_id: holderDid,
        code: code.substring(0, 20) + "...",
        redirect_uri: redirectUri,
        code_verifier: authStateData.codeVerifier.substring(0, 20) + "...",
      });

      const tokenResponse = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: tokenParams.toString(),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error_description || `Errore token exchange: ${tokenResponse.statusText}`
        );
      }

      const tokenData = await tokenResponse.json();
      console.log("APP-EBSI: Token response:", tokenData);

      // Pulisci lo state salvato
      sessionStorage.removeItem("authState");
      setAuthState(null);

      // Procedi con la richiesta della credenziale
      await requestCredential(tokenData, authStateData);
    } catch (err) {
      throw err;
    }
  };

  /**
   * Step 3: Richiedi la credenziale usando l'access token
   */
  const requestCredential = async (tokenData, authStateData) => {
    try {
      const { access_token, c_nonce, token_type = "Bearer" } = tokenData;

      // Recupera credentialOffer e issuerMetadata dall'authStateData
      const credentialOfferData = authStateData.credentialOffer || credentialOffer;
      const issuerMetadataData = authStateData.issuerMetadata || issuerMetadata;

      if (!credentialOfferData) {
        throw new Error("Credential offer non disponibile");
      }

      if (!issuerMetadataData) {
        throw new Error("Issuer metadata non disponibile");
      }

      // Recupera il DID del wallet
      const didDocument = await getDIDDocument();
      if (!didDocument || !didDocument.id) {
        throw new Error("DID del wallet non trovato. Configura prima un'identità.");
      }

      const holderDid = didDocument.id;
      console.log("APP-EBSI: Holder DID:", holderDid);
      console.log("APP-EBSI: DID Document:", JSON.stringify(didDocument, null, 2));

      // Genera proof JWT firmato con il DID
      console.log("APP-EBSI: Creating proof JWT with:");
      console.log("APP-EBSI:   - iss (holder DID):", holderDid);
      console.log("APP-EBSI:   - aud (credential_issuer):", credentialOfferData.credential_issuer);
      console.log("APP-EBSI:   - nonce (c_nonce):", c_nonce);

      const proofJwt = await createProofJWT(
        holderDid,
        credentialOfferData.credential_issuer,
        c_nonce
      );

      // Decodifica e mostra il JWT per debug
      const jwtParts = proofJwt.split(".");
      if (jwtParts.length === 3) {
        const header = JSON.parse(atob(jwtParts[0].replace(/-/g, "+").replace(/_/g, "/")));
        const payload = JSON.parse(atob(jwtParts[1].replace(/-/g, "+").replace(/_/g, "/")));
        console.log("APP-EBSI: JWT Proof Header:", JSON.stringify(header, null, 2));
        console.log("APP-EBSI: JWT Proof Payload:", JSON.stringify(payload, null, 2));
      }

      console.log("APP-EBSI: Proof JWT generato:", proofJwt.substring(0, 100) + "...");

      const credentialEndpoint = issuerMetadataData.credential_endpoint;
      const credentialConfigIds =
        credentialOfferData.credential_configuration_ids || credentialOfferData.credentials;

      console.log("APP-EBSI: 📋 Credential Offer Structure:");
      console.log(
        "  - credential_configuration_ids:",
        credentialOfferData.credential_configuration_ids
      );
      console.log(
        "APP-EBSI:   - credentials:",
        JSON.stringify(credentialOfferData.credentials, null, 2)
      );
      console.log("APP-EBSI:   - grants:", JSON.stringify(credentialOfferData.grants, null, 2));

      if (
        !credentialConfigIds ||
        (Array.isArray(credentialConfigIds) && credentialConfigIds.length === 0)
      ) {
        throw new Error("Nessuna configurazione di credenziale specificata nell'offer");
      }

      // Prendi la prima configurazione (o implementa selezione multipla)
      const credentialConfigItem = Array.isArray(credentialConfigIds)
        ? credentialConfigIds[0]
        : credentialConfigIds;

      console.log("APP-EBSI: 📍 Credential request a:", credentialEndpoint);
      console.log(
        "APP-EBSI: 📝 Credential config item:",
        JSON.stringify(credentialConfigItem, null, 2)
      );

      // Prepara il body della richiesta
      const requestBody = {
        format: "jwt_vc_json", // o "jwt_vc" secondo il formato supportato
        proof: {
          proof_type: "jwt",
          jwt: proofJwt,
        },
      };

      // Se usa credential_configuration_ids (nuovo formato)
      if (credentialOfferData.credential_configuration_ids) {
        requestBody.credential_identifier = credentialConfigItem;
      } else {
        // Formato legacy con credentials contenente oggetti con types
        // EBSI usa questo formato: credentials: [{types: [...], format: "..."}]
        if (typeof credentialConfigItem === "string") {
          // String semplice: usa come type
          requestBody.types = [credentialConfigItem];
        } else if (credentialConfigItem?.types && Array.isArray(credentialConfigItem.types)) {
          // Oggetto con campo types (formato EBSI)
          requestBody.types = credentialConfigItem.types;
          console.log("APP-EBSI: ✅ Types estratti dall'oggetto credential:", requestBody.types);
        } else if (Array.isArray(credentialConfigItem)) {
          // È già un array di types
          requestBody.types = credentialConfigItem;
        } else {
          // Fallback: prova a estrarre types dal primo credential object
          throw new Error(
            "Formato credenziale non supportato: " + JSON.stringify(credentialConfigItem)
          );
        }
      }

      console.log("APP-EBSI: 📤 Credential Request body:", JSON.stringify(requestBody, null, 2));

      // Effettua la richiesta della credenziale
      const credentialResponse = await fetch(credentialEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token_type} ${access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!credentialResponse.ok) {
        const errorData = await credentialResponse.json().catch(() => ({}));
        console.error("APP-EBSI: ❌ Credential Request Failed:");
        console.error("APP-EBSI:   Status:", credentialResponse.status);
        console.error("APP-EBSI:   Status Text:", credentialResponse.statusText);
        console.error("APP-EBSI:   Error Data:", JSON.stringify(errorData, null, 2));
        console.error("APP-EBSI:   Request was sent to:", credentialEndpoint);
        console.error(
          "APP-EBSI:   With Authorization:",
          `${token_type} ${access_token.substring(0, 20)}...`
        );

        throw new Error(
          errorData.error_description ||
            errorData.error ||
            `Errore credential request: ${credentialResponse.statusText}`
        );
      }

      const credentialData = await credentialResponse.json();
      console.log("APP-EBSI: Credential response:", credentialData);

      // Gestisci deferred flow
      if (credentialData.acceptance_token) {
        await handleDeferredCredential(credentialData.acceptance_token, credentialEndpoint);
        return;
      }

      // Credenziale ricevuta immediatamente
      if (credentialData.credential) {
        // Determina il tipo di credenziale per il salvataggio
        let credentialType = "VerifiableCredential";
        if (typeof credentialConfigItem === "string") {
          credentialType = credentialConfigItem;
        } else if (credentialConfigItem?.types && Array.isArray(credentialConfigItem.types)) {
          // Usa l'ultimo type che di solito è il più specifico
          credentialType = credentialConfigItem.types[credentialConfigItem.types.length - 1];
        }

        await saveReceivedCredential(credentialData.credential, credentialType);
        setLoading(false);

        navigate("/credentials", {
          state: {
            success: true,
            message: "Credenziale ricevuta e salvata con successo!",
          },
        });
      } else {
        throw new Error("Risposta della credenziale non valida");
      }
    } catch (err) {
      throw err;
    }
  };

  /**
   * Gestisce il deferred credential flow
   */
  const handleDeferredCredential = async (acceptanceToken, credentialEndpoint) => {
    console.log("APP-EBSI: Deferred flow: attendere il completamento dell'issuer");

    try {
      // Attendi 5 secondi prima di provare (come da spec EBSI)
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Endpoint per deferred credential
      const deferredEndpoint =
        issuerMetadata.deferred_credential_endpoint ||
        `${credentialEndpoint.replace("/credential", "")}/deferred-credential`;

      console.log("APP-EBSI: Polling deferred credential da:", deferredEndpoint);

      // Prova fino a 10 volte con intervalli di 3 secondi
      for (let attempt = 0; attempt < 10; attempt++) {
        const response = await fetch(deferredEndpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${acceptanceToken}`,
          },
        });

        if (!response.ok) {
          if (response.status === 400) {
            // Potrebbe non essere ancora pronto
            console.log(`Tentativo ${attempt + 1}: credenziale non ancora pronta`);
            await new Promise((resolve) => setTimeout(resolve, 3000));
            continue;
          }

          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error_description || `Errore deferred credential: ${response.statusText}`
          );
        }

        const credentialData = await response.json();
        console.log("APP-EBSI: Deferred credential ricevuta:", credentialData);

        if (credentialData.credential) {
          await saveReceivedCredential(credentialData.credential, "deferred");
          setLoading(false);

          navigate("/credentials", {
            state: {
              success: true,
              message: "Credenziale deferred ricevuta e salvata con successo!",
            },
          });
          return;
        }

        // Se ancora non pronta, riprova
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      throw new Error("Timeout: credenziale deferred non disponibile dopo 10 tentativi");
    } catch (err) {
      throw err;
    }
  };

  /**
   * Salva la credenziale ricevuta nello storage
   */
  const saveReceivedCredential = async (credential, type) => {
    try {
      // La credenziale potrebbe essere JWT o JSON
      let credentialToSave = credential;

      // Se è JWT, decodifica per visualizzazione
      if (typeof credential === "string" && credential.split(".").length === 3) {
        console.log("APP-EBSI: Credenziale in formato JWT");

        // Decodifica il JWT per estrarre il payload
        try {
          const jwtParts = credential.split(".");
          const payload = JSON.parse(atob(jwtParts[1].replace(/-/g, "+").replace(/_/g, "/")));

          console.log("APP-EBSI: JWT Payload decodificato:", payload);

          // Il payload contiene il campo 'vc' con la credenziale W3C
          const vcData = payload.vc || {};

          // Crea l'oggetto credenziale con i campi necessari
          // Assicurati che credentialSubject abbia sempre un id
          const credentialSubject = vcData.credentialSubject || {};
          if (!credentialSubject.id && payload.sub) {
            credentialSubject.id = payload.sub;
          }

          credentialToSave = {
            // Campi standard W3C VC
            "@context": vcData["@context"] || ["https://www.w3.org/2018/credentials/v1"],
            id: vcData.id || payload.jti || `urn:uuid:${Date.now()}`,
            type: vcData.type || [type],
            issuer: vcData.issuer || payload.iss,
            issuanceDate:
              vcData.issuanceDate || vcData.issued || new Date(payload.iat * 1000).toISOString(),
            expirationDate:
              vcData.expirationDate ||
              (payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined),
            credentialSubject: credentialSubject,
            credentialSchema: vcData.credentialSchema,

            // Metadata aggiuntivi
            _jwt: credential, // Salva anche il JWT originale
            _format: "jwt_vc",
            _receivedAt: new Date().toISOString(),

            // Salva anche l'oggetto vc originale per facilitare i match
            vc: vcData,

            // Copia tutti gli altri campi dal vc
            ...vcData,
          };

          console.log("APP-EBSI: Credenziale decodificata da salvare:", credentialToSave);
        } catch (decodeError) {
          console.error("APP-EBSI: Errore nella decodifica del JWT:", decodeError);
          // Fallback: salva come oggetto semplice
          credentialToSave = {
            jwt: credential,
            type: type,
            format: "jwt_vc",
            receivedAt: new Date().toISOString(),
          };
        }
      } else {
        credentialToSave = {
          ...credential,
          type: type,
          format: "json",
          receivedAt: new Date().toISOString(),
        };
      }

      const credentialId = await saveCredential(credentialToSave);
      console.log("APP-EBSI: Credenziale salvata con ID:", credentialId);
    } catch (err) {
      console.error("APP-EBSI: Errore nel salvataggio della credenziale:", err);
      throw new Error(`Errore nel salvataggio: ${err.message}`);
    }
  };

  const declineOffer = () => {
    navigate("/scan-qr", {
      state: {
        message: "Credential offer rifiutato",
      },
    });
  };

  if (!credentialOffer) {
    return (
      <PageBase title="Credential Offer">
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              Nessun credential offer fornito
            </Typography>
            {location.state && (
              <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                State ricevuto: {JSON.stringify(location.state, null, 2)}
              </Typography>
            )}
          </Alert>
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Possibili cause:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li>Il link non contiene i parametri necessari</li>
              <li>L'app è stata aperta senza un credential offer valido</li>
              <li>Il formato dell'URL non è corretto</li>
            </Typography>
          </Box>
          <Button fullWidth variant="contained" onClick={() => navigate("/home")} sx={{ mt: 3 }}>
            Torna alla Home
          </Button>
        </Container>
      </PageBase>
    );
  }

  return (
    <PageBase title="Credential Offer">
      <Container maxWidth="sm" sx={{ py: 3 }}>
        {/* Info Issuer */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Offerta di Credenziale
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Issuer
              </Typography>
              <Typography variant="body1" sx={{ wordBreak: "break-all", fontWeight: 500 }}>
                {credentialOffer.credential_issuer}
              </Typography>
            </Box>

            {/* Credential Types */}
            {(credentialOffer.credential_configuration_ids || credentialOffer.credentials) && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Credenziali Offerte
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {(
                    credentialOffer.credential_configuration_ids || credentialOffer.credentials
                  ).map((cred, index) => (
                    <Chip
                      key={index}
                      label={typeof cred === "string" ? cred : cred.type || "Unknown"}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Flow Type */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tipo di flusso
              </Typography>
              <Chip
                label={
                  credentialOffer.grants?.["urn:ietf:params:oauth:grant-type:pre-authorized_code"]
                    ? "Pre-Authorized"
                    : "Authorization Code"
                }
                color="primary"
                size="small"
              />
            </Box>
          </CardContent>
        </Card>

        {/* Discovery Status */}
        {loading && !issuerMetadata && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <CircularProgress size={24} />
            <Typography>Caricamento configurazioni...</Typography>
          </Box>
        )}

        {issuerMetadata && authServerMetadata && (
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3 }}>
            Configurazioni scaricate correttamente
          </Alert>
        )}

        {/* PIN Input (se richiesto) */}
        {requiresPin && issuerMetadata && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                PIN Richiesto
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Questa credenziale richiede un PIN. Inserisci il PIN fornito dall'issuer.
              </Typography>
              <TextField
                fullWidth
                label="PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                type="text"
                inputProps={{ maxLength: 10 }}
                placeholder="Inserisci PIN"
              />
            </CardContent>
          </Card>
        )}

        {/* Errori */}
        {error && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Azioni */}
        <Box sx={{ display: "flex", gap: 2, flexDirection: "column" }}>
          <Button
            variant="contained"
            size="large"
            onClick={acceptOffer}
            disabled={loading || !issuerMetadata || (requiresPin && !pin)}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : "Accetta e Richiedi Credenziale"}
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={declineOffer}
            disabled={loading}
            fullWidth
          >
            Rifiuta
          </Button>
        </Box>

        {/* Debug Info (solo in development) */}
        {import.meta.env.DEV && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Debug Info
            </Typography>
            <pre
              style={{
                fontSize: "10px",
                background: "#f5f5f5",
                padding: "8px",
                borderRadius: "4px",
                overflow: "auto",
              }}
            >
              {JSON.stringify({ credentialOffer, issuerMetadata, authServerMetadata }, null, 2)}
            </pre>
          </Box>
        )}
      </Container>
    </PageBase>
  );
}
