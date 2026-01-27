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

/**
 * Pagina per gestire Credential Offering secondo OpenID4VCI
 * Riferimento: EBSI Wallet Conformance Guidelines
 * https://api-conformance.ebsi.eu/docs/wallet-conformance
 */
export default function CredentialOffer() {
  const location = useLocation();
  const navigate = useNavigate();

  const { credentialOffer, sourceUri } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [issuerMetadata, setIssuerMetadata] = useState(null);
  const [authServerMetadata, setAuthServerMetadata] = useState(null);
  const [pin, setPin] = useState("");
  const [requiresPin, setRequiresPin] = useState(false);
  const [authState, setAuthState] = useState(null); // Per Authorization Code Flow

  useEffect(() => {
    if (!credentialOffer) {
      setError("Nessun credential offer fornito");
      return;
    }

    // Avvia il discovery
    discoverMetadata();
  }, [credentialOffer]);

  // Gestisci il ritorno dall'authorization flow
  useEffect(() => {
    const handleAuthCallback = async () => {
      // Verifica se stiamo ritornando da un authorization flow
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");

      if (code && state) {
        const savedState = sessionStorage.getItem("authState");
        if (savedState) {
          try {
            const authStateData = JSON.parse(savedState);
            if (authStateData.state === state) {
              await exchangeCodeForToken(code, authStateData);
            } else {
              setError("State mismatch - possibile attacco CSRF");
            }
          } catch (err) {
            console.error("Errore nel processing del callback:", err);
            setError(err.message);
          }
        }
      }
    };

    handleAuthCallback();
  }, []);

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

      console.log("Discovery da:", credential_issuer);

      // 1. Scarica OpenID Credential Issuer Metadata
      const issuerMetadataUrl = `${credential_issuer}/.well-known/openid-credential-issuer`;
      console.log("Fetching issuer metadata:", issuerMetadataUrl);

      const issuerResponse = await fetch(issuerMetadataUrl);
      if (!issuerResponse.ok) {
        throw new Error(
          `Errore nel download dei metadata dell'issuer: ${issuerResponse.statusText}`
        );
      }
      const issuerMeta = await issuerResponse.json();
      setIssuerMetadata(issuerMeta);
      console.log("Issuer Metadata:", issuerMeta);

      // 2. Scarica OpenID Authorization Server Metadata
      const authServer = issuerMeta.authorization_server || issuerMeta.authorization_servers?.[0];
      if (!authServer) {
        throw new Error("Authorization server non trovato nei metadata dell'issuer");
      }

      const authMetadataUrl = `${authServer}/.well-known/openid-configuration`;
      console.log("Fetching auth server metadata:", authMetadataUrl);

      const authResponse = await fetch(authMetadataUrl);
      if (!authResponse.ok) {
        throw new Error(
          `Errore nel download dei metadata dell'auth server: ${authResponse.statusText}`
        );
      }
      const authMeta = await authResponse.json();
      setAuthServerMetadata(authMeta);
      console.log("Auth Server Metadata:", authMeta);

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
      console.error("Errore discovery:", err);
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
      console.error("Errore nell'accettazione dell'offer:", err);
      setError(err.message || "Errore nell'accettazione dell'offer");
      setLoading(false);
    }
  };

  /**
   * Gestisce il Pre-Authorized Flow
   */
  const handlePreAuthorizedFlow = async () => {
    console.log("Avvio Pre-Authorized Flow");

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

      console.log("Token request:", tokenEndpoint, tokenParams.toString());

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
      console.log("Token response:", tokenData);

      // Procedi con la richiesta della credenziale
      await requestCredential(tokenData);
    } catch (err) {
      throw err;
    }
  };

  /**
   * Gestisce l'Authorization Code Flow con ID Token authentication
   */
  const handleAuthorizationCodeFlow = async () => {
    console.log("Avvio Authorization Code Flow");

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

      const authParams = new URLSearchParams({
        response_type: "code",
        client_id: holderDid,
        redirect_uri: redirectUri,
        scope: "openid",
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      });

      // Aggiungi issuer_state se presente nel grant
      const authCodeGrant = credentialOffer.grants?.authorization_code;
      if (authCodeGrant?.issuer_state) {
        authParams.append("issuer_state", authCodeGrant.issuer_state);
      }

      const authUrl = `${authEndpoint}?${authParams.toString()}`;
      console.log("Authorization Request URL:", authUrl);

      // 3. Effettua la richiesta di autorizzazione
      // In un contesto mobile, questo aprirebbe il browser
      // Per ora simuliamo il flusso direttamente
      const authResponse = await fetch(authUrl, {
        method: "GET",
        redirect: "manual",
      });

      // Gestisci la risposta (redirect verso ID Token Request)
      await handleAuthorizationResponse(authResponse, authStateData, holderDid, redirectUri);
    } catch (err) {
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
          const url = new URL(locationHeader);
          idTokenRequestParams = Object.fromEntries(url.searchParams);
        }
      } else if (authResponse.ok) {
        // Oppure potrebbe essere nel body come JSON
        idTokenRequestParams = await authResponse.json();
      } else {
        throw new Error(`Errore nella authorization request: ${authResponse.statusText}`);
      }

      console.log("ID Token Request params:", idTokenRequestParams);

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

      console.log("ID Token creato per authentication");

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
      console.log("Invio ID Token Response a:", redirectUri);

      const responseBody = new URLSearchParams({
        id_token: idToken,
      });

      if (state) {
        responseBody.append("state", state);
      }

      // Invia la risposta tramite POST (direct_post mode)
      const response = await fetch(redirectUri, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: responseBody.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error_description || `Errore ID Token Response: ${response.statusText}`
        );
      }

      // L'Auth Server risponde con un redirect contenente il code
      const authCodeResponse = await response.json();
      console.log("Authorization Code Response:", authCodeResponse);

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
      console.log("Exchange authorization code per access token");

      const tokenEndpoint = authStateData.authServerMetadata.token_endpoint;
      const redirectUri = "openid://";

      const tokenParams = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
        code_verifier: authStateData.codeVerifier,
      });

      console.log("Token request to:", tokenEndpoint);

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
      console.log("Token response:", tokenData);

      // Pulisci lo state salvato
      sessionStorage.removeItem("authState");
      setAuthState(null);

      // Procedi con la richiesta della credenziale
      await requestCredential(tokenData);
    } catch (err) {
      throw err;
    }
  };

  /**
   * Step 3: Richiedi la credenziale usando l'access token
   */
  const requestCredential = async (tokenData) => {
    try {
      const { access_token, c_nonce, token_type = "Bearer" } = tokenData;

      // Recupera il DID del wallet
      const didDocument = await getDIDDocument();
      if (!didDocument || !didDocument.id) {
        throw new Error("DID del wallet non trovato. Configura prima un'identità.");
      }

      const holderDid = didDocument.id;
      console.log("Holder DID:", holderDid);
      console.log("DID Document:", JSON.stringify(didDocument, null, 2));

      // Genera proof JWT firmato con il DID
      console.log("Creating proof JWT with:");
      console.log("  - iss (holder DID):", holderDid);
      console.log("  - aud (credential_issuer):", credentialOffer.credential_issuer);
      console.log("  - nonce (c_nonce):", c_nonce);

      const proofJwt = await createProofJWT(holderDid, credentialOffer.credential_issuer, c_nonce);

      // Decodifica e mostra il JWT per debug
      const jwtParts = proofJwt.split(".");
      if (jwtParts.length === 3) {
        const header = JSON.parse(atob(jwtParts[0].replace(/-/g, "+").replace(/_/g, "/")));
        const payload = JSON.parse(atob(jwtParts[1].replace(/-/g, "+").replace(/_/g, "/")));
        console.log("JWT Proof Header:", JSON.stringify(header, null, 2));
        console.log("JWT Proof Payload:", JSON.stringify(payload, null, 2));
      }

      console.log("Proof JWT generato:", proofJwt.substring(0, 100) + "...");

      const credentialEndpoint = issuerMetadata.credential_endpoint;
      const credentialConfigIds =
        credentialOffer.credential_configuration_ids || credentialOffer.credentials;

      if (
        !credentialConfigIds ||
        (Array.isArray(credentialConfigIds) && credentialConfigIds.length === 0)
      ) {
        throw new Error("Nessuna configurazione di credenziale specificata nell'offer");
      }

      // Prendi la prima configurazione (o implementa selezione multipla)
      const credentialConfigId = Array.isArray(credentialConfigIds)
        ? credentialConfigIds[0]
        : credentialConfigIds;

      console.log("Credential request a:", credentialEndpoint);
      console.log("Credential config ID:", credentialConfigId);

      // Prepara il body della richiesta
      const requestBody = {
        format: "jwt_vc_json", // o "jwt_vc" secondo il formato supportato
        proof: {
          proof_type: "jwt",
          jwt: proofJwt,
        },
      };

      // Se usa credential_configuration_ids (nuovo formato)
      if (credentialOffer.credential_configuration_ids) {
        requestBody.credential_identifier = credentialConfigId;
      } else {
        // Formato legacy con types - deve essere sempre un array
        if (typeof credentialConfigId === "string") {
          requestBody.types = [credentialConfigId];
        } else if (Array.isArray(credentialConfigId)) {
          requestBody.types = credentialConfigId;
        } else if (credentialConfigId?.types) {
          // Se è un oggetto con campo types
          requestBody.types = Array.isArray(credentialConfigId.types)
            ? credentialConfigId.types
            : [credentialConfigId.types];
        } else {
          // Fallback: prova a estrarre types dal primo credential object
          throw new Error("Formato credenziale non supportato");
        }
      }

      console.log("Request body:", requestBody);

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
        console.error("❌ Credential Request Failed:");
        console.error("  Status:", credentialResponse.status);
        console.error("  Status Text:", credentialResponse.statusText);
        console.error("  Error Data:", JSON.stringify(errorData, null, 2));
        console.error("  Request was sent to:", credentialEndpoint);
        console.error("  With Authorization:", `${token_type} ${access_token.substring(0, 20)}...`);

        throw new Error(
          errorData.error_description ||
            errorData.error ||
            `Errore credential request: ${credentialResponse.statusText}`
        );
      }

      const credentialData = await credentialResponse.json();
      console.log("Credential response:", credentialData);

      // Gestisci deferred flow
      if (credentialData.acceptance_token) {
        await handleDeferredCredential(credentialData.acceptance_token, credentialEndpoint);
        return;
      }

      // Credenziale ricevuta immediatamente
      if (credentialData.credential) {
        await saveReceivedCredential(credentialData.credential, credentialConfigId);
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
    console.log("Deferred flow: attendere il completamento dell'issuer");

    try {
      // Attendi 5 secondi prima di provare (come da spec EBSI)
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Endpoint per deferred credential
      const deferredEndpoint =
        issuerMetadata.deferred_credential_endpoint ||
        `${credentialEndpoint.replace("/credential", "")}/deferred_credential`;

      console.log("Polling deferred credential da:", deferredEndpoint);

      // Prova fino a 10 volte con intervalli di 3 secondi
      for (let attempt = 0; attempt < 10; attempt++) {
        const response = await fetch(deferredEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
        console.log("Deferred credential ricevuta:", credentialData);

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
        console.log("Credenziale in formato JWT");
        credentialToSave = {
          jwt: credential,
          type: type,
          format: "jwt_vc",
          receivedAt: new Date().toISOString(),
        };
      } else {
        credentialToSave = {
          ...credential,
          type: type,
          format: "json",
          receivedAt: new Date().toISOString(),
        };
      }

      const credentialId = await saveCredential(credentialToSave);
      console.log("Credenziale salvata con ID:", credentialId);
    } catch (err) {
      console.error("Errore nel salvataggio della credenziale:", err);
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
          <Alert severity="error">Nessun credential offer fornito</Alert>
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
