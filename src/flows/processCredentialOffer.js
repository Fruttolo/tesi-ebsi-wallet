export const authorizeCredentialOffer = async (authorizationEndpoint) => {
  try {
    const response = await CapacitorHttp.get({ url: authorizationEndpoint });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Errore nell'autorizzazione del credential offer: ${response.statusText}`);
    }

    console.log("APP-EBSI: Credential offer autorizzato con successo:", response.data);
    return true;
  } catch (error) {
    console.error("APP-EBSI: Errore durante l'autorizzazione del credential offer:", error);
    throw new Error("Errore nell'autorizzazione del credential offer: " + error.message);
  }
};
