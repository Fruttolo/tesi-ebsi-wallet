import { CapacitorHttp } from "@capacitor/core";

/* 
    Flusso di discovery per OpenID4VP e OpenID4VCI
*/
export const discoverOpenID = async (uri) => {
  try {
    // 1. Ottieni credential offer
    const credentialOffer = await getCredentialOffer(uri);

    // 2. Ottieni well-known dell'issuer
    const wellKnownCredentialIssuer = await getWellKnownCredentialIssuer(
      credentialOffer.credential_issuer
    );

    let urlConfiguration = "";
    if (wellKnownCredentialIssuer.authorization_server) {
      urlConfiguration = wellKnownCredentialIssuer.authorization_server;
    } else if (wellKnownCredentialIssuer.credential_issuer) {
      urlConfiguration = wellKnownCredentialIssuer.credential_issuer;
    } else {
      throw new Error("Nessun authorization_server trovato nel well-known dell'issuer");
    }

    // 3. Ottieni well-known della configurazione
    const wellKnownConfiguration = await getWellKnownConfiguration(urlConfiguration);

    if (!wellKnownConfiguration.authorization_endpoint) {
      throw new Error("Nessun authorization_endpoint trovato nella configurazione dell'issuer");
    }

    const response = {
      requiresPreAuth:
        !!credentialOffer.grants?.["urn:ietf:params:oauth:grant-type:pre-authorized_code"]
          ?.user_pin_required || false,
      issuerName: credentialOffer.credential_issuer || "",
      credentialOffer: credentialOffer.credentials || [],
      urlAuthorization: wellKnownConfiguration.authorization_endpoint || "",
    };
    return response;
  } catch (error) {
    throw new Error("Errore nel flusso di discovery OpenID: " + error.message);
  }
};

export const getCredentialOffer = async (uri) => {
  // Implementazione del flusso di discovery
  const url = new URL(uri);
  console.log("APP-EBSI: Parsing credential offer from URL:", url.toString());
  const credentialOfferUri = url.searchParams.get("credential_offer_uri");

  if (credentialOfferUri) {
    const response = await CapacitorHttp.get({ url: credentialOfferUri });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Errore nel download del credential offer: ${response.statusText}`);
    }

    sessionStorage.setItem("credential_offer", JSON.stringify(response.data));
    return response.data;
  } else {
    throw new Error("Credential offer non trovato nell'URI");
  }
};

export const getWellKnownCredentialIssuer = async (issuerUrl) => {
  try {
    const response = await CapacitorHttp.get({
      url: `${issuerUrl}/.well-known/openid-credential-issuer`,
    });
    if (response.status !== 200) {
      throw new Error(`Errore nel download del well-known: ${response.statusText}`);
    }

    sessionStorage.setItem("openid_credential_issuer", JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    throw new Error(
      "Errore nel recupero del well-known openid-credential-issuer: " + error.message
    );
  }
};

export const getWellKnownConfiguration = async (authorizationServerUrl) => {
  try {
    const response = await CapacitorHttp.get({
      url: `${authorizationServerUrl}/.well-known/openid-configuration`,
    });
    if (response.status !== 200) {
      throw new Error(`Errore nel download della configurazione: ${response.statusText}`);
    }

    sessionStorage.setItem("openid_configuration", JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    throw new Error("Errore nel recupero del well-known openid-configuration: " + error.message);
  }
};
