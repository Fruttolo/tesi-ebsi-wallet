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
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import PageBase from "../components/PageBase";
import { getStoredCredentials } from "../storage/credentialStorage";
import { getDIDDocument } from "../identity/didManager";
import { createVPToken, decodeJWT } from "../crypto/jwtUtils";

/**
 * Pagina per gestire Presentation Request secondo OpenID4VP
 * Riferimento: EBSI Wallet Conformance Guidelines - Request and present Verifiable Credentials
 * https://api-conformance.ebsi.eu/docs/wallet-conformance
 */
export default function PresentationRequest() {
  const location = useLocation();
  const navigate = useNavigate();

  const { uri, type } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [presentationRequest, setPresentationRequest] = useState(null);
  const [clientMetadata, setClientMetadata] = useState(null);
  const [availableCredentials, setAvailableCredentials] = useState([]);
  const [selectedCredentials, setSelectedCredentials] = useState([]);
  const [verifierInfo, setVerifierInfo] = useState(null);

  useEffect(() => {
    if (!uri) {
      setError("Nessun URI di presentation request fornito");
      return;
    }

    // Avvia il parsing della request
    parsePresentationRequest();
  }, [uri]);

  /**
   * Step 1: Parse della Presentation Request
   */
  const parsePresentationRequest = async () => {
    setLoading(true);
    setError("");

    try {
      console.log("APP-EBSI: Parsing Presentation Request URI:", uri);

      // Parse dell'URI openid4vp:// o openid://
      const url = new URL(uri);

      // Estrai i parametri dalla query string
      const params = {};
      url.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      console.log("APP-EBSI: Parametri estratti:", params);

      // Caso 1: request_uri - scarica la request da un endpoint
      if (params.request_uri) {
        console.log("APP-EBSI: Scaricamento Presentation Request da:", params.request_uri);
        const response = await fetch(params.request_uri);
        if (!response.ok) {
          throw new Error(`Errore nel download della presentation request: ${response.statusText}`);
        }
        const requestData = await response.json();
        setPresentationRequest(requestData);
        await processPresentationRequest(requestData);
      }
      // Caso 2: request JWT - decodifica il JWT
      else if (params.request) {
        console.log("APP-EBSI: Decodifica JWT request");
        const decodedRequest = decodeJWT(params.request);
        setPresentationRequest(decodedRequest);
        await processPresentationRequest(decodedRequest);
      }
      // Caso 3: parametri inline
      else {
        setPresentationRequest(params);
        await processPresentationRequest(params);
      }

      setLoading(false);
    } catch (err) {
      console.error("APP-EBSI: Errore parsing presentation request:", err);
      setError(err.message || "Errore durante il parsing della presentation request");
      setLoading(false);
    }
  };

  /**
   * Decodifica un JWT (senza verifica della firma per ora)
   */
  const decodeJWT = (jwt) => {
    try {
      const parts = jwt.split(".");
      if (parts.length !== 3) {
        throw new Error("JWT non valido");
      }
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (err) {
      throw new Error("Errore nella decodifica del JWT");
    }
  };

  /**
   * Step 2: Processa la Presentation Request e trova le credenziali matching
   */
  const processPresentationRequest = async (request) => {
    try {
      console.log("APP-EBSI: Processing Presentation Request:", request);

      // Estrai informazioni sul verifier
      const verifier = {
        clientId: request.client_id,
        responseUri: request.response_uri || request.redirect_uri,
        responseMode: request.response_mode || "direct_post",
        nonce: request.nonce,
        state: request.state,
      };
      setVerifierInfo(verifier);

      // Parse client_metadata se presente
      if (request.client_metadata) {
        try {
          const metadata =
            typeof request.client_metadata === "string"
              ? JSON.parse(request.client_metadata)
              : request.client_metadata;
          setClientMetadata(metadata);
        } catch (e) {
          console.warn("Errore parsing client_metadata:", e);
        }
      }

      // Parse presentation_definition
      let presentationDefinition = request.presentation_definition;

      // Se è una stringa, prova a parsarla
      if (typeof presentationDefinition === "string") {
        try {
          presentationDefinition = JSON.parse(presentationDefinition);
        } catch (e) {
          console.warn("Errore parsing presentation_definition:", e);
        }
      }

      // Se presentation_definition_uri, scaricala
      if (request.presentation_definition_uri) {
        console.log(
          "Scaricamento Presentation Definition da:",
          request.presentation_definition_uri
        );
        const response = await fetch(request.presentation_definition_uri);
        if (!response.ok) {
          throw new Error(
            `Errore nel download della presentation definition: ${response.statusText}`
          );
        }
        presentationDefinition = await response.json();
      }

      if (!presentationDefinition) {
        throw new Error("Presentation definition non trovata");
      }

      console.log("APP-EBSI: Presentation Definition:", presentationDefinition);

      // Trova le credenziali che matchano
      await findMatchingCredentials(presentationDefinition);
    } catch (err) {
      throw err;
    }
  };

  /**
   * Step 3: Trova le credenziali nel wallet che matchano la presentation definition
   */
  const findMatchingCredentials = async (presentationDefinition) => {
    try {
      // Carica tutte le credenziali dal wallet
      const storedCredentials = await getStoredCredentials();
      console.log("APP-EBSI: Credenziali nel wallet:", storedCredentials);
      console.log(
        "APP-EBSI: Tipi di credenziali disponibili:",
        storedCredentials.map((c) => ({ id: c.id, type: c.type || c.vc?.type }))
      );

      if (!storedCredentials || storedCredentials.length === 0) {
        setError("Nessuna credenziale disponibile nel wallet");
        return;
      }

      // Input descriptors dalla presentation definition
      const inputDescriptors = presentationDefinition.input_descriptors || [];
      console.log("APP-EBSI: Input descriptors richiesti:", inputDescriptors);
      console.log(
        "APP-EBSI: Numero di descriptors:",
        inputDescriptors.length,
        "- Questo è un test per CT Qualification con tutte le credenziali"
      );

      // Matcha le credenziali
      const matching = [];

      for (const descriptor of inputDescriptors) {
        const credentialsForDescriptor = storedCredentials.filter((cred) => {
          // Match per tipo di credenziale
          if (descriptor.constraints?.fields) {
            for (const field of descriptor.constraints.fields) {
              const path = field.path?.[0];
              if (path && path.includes("type")) {
                // Estrai il tipo richiesto - supporta diversi formati del filter
                let requiredType =
                  field.filter?.contains?.const || // Per array contains
                  field.filter?.const || // Per valore diretto
                  field.filter?.pattern; // Per pattern regex

                if (requiredType) {
                  // Cerca il tipo nella credenziale in diverse location possibili
                  let credType = cred.type || cred.vc?.type;

                  // Se la credenziale ha un _jwt, decodificalo per accedere al tipo
                  if (!credType && cred._jwt) {
                    try {
                      const decoded = decodeJWT(cred._jwt);
                      credType = decoded.payload?.vc?.type;
                    } catch (e) {
                      console.warn("Impossibile decodificare JWT per matching:", e);
                    }
                  }

                  if (!credType) {
                    return false;
                  }

                  const typeArray = Array.isArray(credType) ? credType : [credType];

                  // Match con pattern o valore esatto
                  if (typeof requiredType === "string") {
                    return typeArray.some((t) => t.includes(requiredType) || t === requiredType);
                  }
                }
              }
            }
          }
          return false;
        });

        if (credentialsForDescriptor.length > 0) {
          console.log(
            `APP-EBSI: Trovate ${credentialsForDescriptor.length} credenziali per descriptor "${descriptor.id}"`
          );
          matching.push({
            descriptor,
            credentials: credentialsForDescriptor,
          });
        } else {
          console.warn(`APP-EBSI: NESSUNA credenziale trovata per descriptor "${descriptor.id}"`);
        }
      }

      console.log("APP-EBSI: Credenziali matching trovate:", matching);
      console.log(`APP-EBSI: Matched ${matching.length} su ${inputDescriptors.length} descriptors`);

      if (matching.length === 0) {
        setError("Nessuna credenziale nel wallet corrisponde alla richiesta del verifier");
        return;
      }

      // Verifica se mancano delle credenziali richieste
      if (matching.length < inputDescriptors.length) {
        const missingDescriptors = inputDescriptors.filter(
          (d) => !matching.some((m) => m.descriptor.id === d.id)
        );
        console.warn(
          "APP-EBSI: Mancano credenziali per i seguenti descriptors:",
          missingDescriptors.map((d) => d.id)
        );
        setError(
          `Attenzione: trovate solo ${matching.length} su ${inputDescriptors.length} credenziali richieste. ` +
            `Mancano: ${missingDescriptors.map((d) => d.id).join(", ")}`
        );
        // Non return - permettiamo comunque di procedere con le credenziali disponibili
      }

      // Flatten delle credenziali per visualizzazione
      const flatCredentials = matching.flatMap((m) =>
        m.credentials.map((c) => ({
          ...c,
          descriptorId: m.descriptor.id,
          descriptorName: m.descriptor.name || m.descriptor.id,
        }))
      );

      setAvailableCredentials(flatCredentials);

      // Auto-seleziona se c'è una sola opzione per descriptor
      const autoSelected = [];
      for (const match of matching) {
        if (match.credentials.length === 1) {
          autoSelected.push(match.credentials[0].id);
        }
      }
      console.log("APP-EBSI: Auto-selezionate", autoSelected.length, "credenziali");
      setSelectedCredentials(autoSelected);
    } catch (err) {
      console.error("APP-EBSI: Errore ricerca credenziali:", err);
      throw new Error(`Errore nella ricerca delle credenziali: ${err.message}`);
    }
  };

  /**
   * Step 4: Crea e invia la Verifiable Presentation
   */
  const submitPresentation = async () => {
    setLoading(true);
    setError("");

    try {
      if (selectedCredentials.length === 0) {
        throw new Error("Seleziona almeno una credenziale da presentare");
      }

      console.log(
        "APP-EBSI: Creazione Verifiable Presentation con credenziali:",
        selectedCredentials
      );

      // Recupera le credenziali selezionate
      const credentials = availableCredentials.filter((c) => selectedCredentials.includes(c.id));
      console.log(
        `APP-EBSI: Invio di ${credentials.length} credenziali al verifier:`,
        credentials.map((c) => ({
          id: c.id,
          type: c.type || c.vc?.type,
          descriptorId: c.descriptorId,
        }))
      );

      // Recupera il DID del wallet
      const didDocument = await getDIDDocument();
      if (!didDocument || !didDocument.id) {
        throw new Error("DID del wallet non trovato. Configura prima un'identità.");
      }

      const holderDid = didDocument.id;
      console.log("APP-EBSI: Holder DID:", holderDid);

      // Crea la Verifiable Presentation
      const vp = await createVerifiablePresentation(
        credentials,
        holderDid,
        verifierInfo.nonce,
        verifierInfo.clientId
      );

      console.log("APP-EBSI: Verifiable Presentation creata:", vp);

      // Crea la presentation_submission
      const presentationSubmission = createPresentationSubmission(
        credentials,
        presentationRequest.presentation_definition
      );

      console.log("APP-EBSI: Presentation Submission:", presentationSubmission);

      // Invia la risposta al verifier
      await sendPresentationResponse(vp, presentationSubmission);
    } catch (err) {
      console.error("APP-EBSI: Errore invio presentation:", err);
      setError(err.message || "Errore durante l'invio della presentation");
      setLoading(false);
    }
  };

  /**
   * Crea una Verifiable Presentation JWT firmata
   */
  const createVerifiablePresentation = async (credentials, holderDid, nonce, audience) => {
    try {
      // Prepara le credenziali - usa il JWT originale se disponibile
      const verifiableCredentials = credentials.map((cred) => {
        // Cerca il JWT in diverse possibili location
        if (cred._jwt) {
          // JWT salvato con underscore
          console.log(`APP-EBSI: Usando JWT per credenziale ${cred.id}`);
          return cred._jwt;
        } else if (cred.jwt) {
          // JWT senza underscore
          console.log(`APP-EBSI: Usando jwt per credenziale ${cred.id}`);
          return cred.jwt;
        } else if (cred.credential) {
          // Credenziale come oggetto
          console.log(`APP-EBSI: Usando credential object per ${cred.id}`);
          return cred.credential;
        } else {
          // Usa l'intera credenziale come oggetto
          console.log(`APP-EBSI: Usando credenziale intera per ${cred.id}`);
          return cred;
        }
      });

      console.log(
        `APP-EBSI: Preparate ${verifiableCredentials.length} credenziali per VP`,
        verifiableCredentials.map((vc, i) =>
          typeof vc === "string" ? `JWT[${i}]` : `Object[${i}]`
        )
      );

      // Crea VP Token JWT firmato usando l'utility
      const vpJwt = await createVPToken(verifiableCredentials, holderDid, nonce, audience);

      console.log("APP-EBSI: VP JWT firmato creato");
      return vpJwt;
    } catch (error) {
      console.error("APP-EBSI: Errore creazione VP:", error);
      throw new Error(`Errore nella creazione della VP: ${error.message}`);
    }
  };

  /**
   * Crea la Presentation Submission secondo DIF Presentation Exchange
   */
  const createPresentationSubmission = (credentials, presentationDefinition) => {
    const descriptorMap = credentials.map((cred, index) => ({
      id: cred.descriptorId,
      format: "jwt_vp",
      path: "$",
      path_nested: {
        id: cred.descriptorId, // Aggiungi l'id anche nel path_nested
        format: "jwt_vc",
        path: `$.vp.verifiableCredential[${index}]`, // Path corretto secondo EBSI spec
      },
    }));

    console.log("APP-EBSI: Descriptor map creato:", descriptorMap);

    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `submission-${Date.now()}`,
      definition_id: presentationDefinition.id,
      descriptor_map: descriptorMap,
    };
  };

  /**
   * Invia la risposta al verifier
   */
  const sendPresentationResponse = async (vp, presentationSubmission) => {
    try {
      const { responseUri, responseMode, state } = verifierInfo;

      if (!responseUri) {
        throw new Error("Response URI non trovato");
      }

      // Prepara i dati da inviare
      const responseData = {
        vp_token: vp, // Ora è il JWT firmato
        presentation_submission: JSON.stringify(presentationSubmission),
      };

      // Aggiungi state se presente
      if (state) {
        responseData.state = state;
      }

      console.log("APP-EBSI: Invio risposta a:", responseUri);
      console.log("APP-EBSI: Response data (senza token completo):", {
        ...responseData,
        vp_token: "[JWT]",
      });

      // Invia in base al response_mode
      if (responseMode === "direct_post" || responseMode === "post") {
        // POST diretto
        const response = await fetch(responseUri, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams(responseData).toString(),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          throw new Error(
            `Errore nell'invio della presentation: ${response.statusText} ${errorText}`
          );
        }

        const result = await response.json().catch(() => ({}));
        console.log("APP-EBSI: Risposta dal verifier:", result);

        // Successo
        setLoading(false);
        navigate("/credentials", {
          state: {
            success: true,
            message: "Credenziali presentate con successo al verifier",
          },
        });
      } else {
        // Altri response_mode non ancora supportati
        throw new Error(`Response mode '${responseMode}' non ancora supportato`);
      }
    } catch (err) {
      throw err;
    }
  };

  const declineRequest = () => {
    navigate("/scan-qr", {
      state: {
        message: "Richiesta di presentazione rifiutata",
      },
    });
  };

  const toggleCredentialSelection = (credentialId) => {
    setSelectedCredentials((prev) =>
      prev.includes(credentialId)
        ? prev.filter((id) => id !== credentialId)
        : [...prev, credentialId]
    );
  };

  if (!uri) {
    return (
      <PageBase title="Presentation Request">
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Alert severity="error">Nessuna presentation request fornita</Alert>
        </Container>
      </PageBase>
    );
  }

  return (
    <PageBase title="Richiesta di Presentazione">
      <Container maxWidth="sm" sx={{ py: 3 }}>
        {/* Info Verifier */}
        {verifierInfo && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <VerifiedUserIcon color="primary" />
                <Typography variant="h6">Richiesta del Verifier</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Verifier
                </Typography>
                <Typography variant="body1" sx={{ wordBreak: "break-all", fontWeight: 500 }}>
                  {clientMetadata?.client_name || verifierInfo.clientId}
                </Typography>
              </Box>

              {clientMetadata?.logo_uri && (
                <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
                  <img
                    src={clientMetadata.logo_uri}
                    alt="Verifier logo"
                    style={{ maxWidth: "100px", maxHeight: "100px" }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && !availableCredentials.length && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <CircularProgress size={24} />
            <Typography>Elaborazione richiesta...</Typography>
          </Box>
        )}

        {/* Credenziali disponibili */}
        {availableCredentials.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Seleziona Credenziali da Presentare
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Il verifier richiede le seguenti credenziali dal tuo wallet:
              </Typography>

              <List>
                {availableCredentials.map((cred) => (
                  <ListItem
                    key={cred.id}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedCredentials.includes(cred.id)}
                          onChange={() => toggleCredentialSelection(cred.id)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight={500}>
                            {cred.descriptorName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {Array.isArray(cred.type)
                              ? cred.type.join(", ")
                              : cred.type || "Credential"}
                          </Typography>
                          {cred.issuer && (
                            <Typography variant="caption" color="text.secondary">
                              Issuer: {cred.issuer.name || cred.issuer.id || cred.issuer}
                            </Typography>
                          )}
                        </Box>
                      }
                      sx={{ width: "100%", m: 0 }}
                    />
                  </ListItem>
                ))}
              </List>
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
        {availableCredentials.length > 0 && (
          <Box sx={{ display: "flex", gap: 2, flexDirection: "column" }}>
            <Button
              variant="contained"
              size="large"
              onClick={submitPresentation}
              disabled={loading || selectedCredentials.length === 0}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : "Condividi Credenziali"}
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={declineRequest}
              disabled={loading}
              fullWidth
            >
              Rifiuta
            </Button>
          </Box>
        )}

        {/* Debug Info (solo in development) */}
        {import.meta.env.DEV && presentationRequest && (
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
                maxHeight: "300px",
              }}
            >
              {JSON.stringify({ presentationRequest, verifierInfo, selectedCredentials }, null, 2)}
            </pre>
          </Box>
        )}
      </Container>
    </PageBase>
  );
}
