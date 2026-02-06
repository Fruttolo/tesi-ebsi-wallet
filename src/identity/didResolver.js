/**
 * Risolve un DID tramite EBSI DID Registry
 * @param {string} did - DID da risolvere
 * @param {string} environment - Ambiente EBSI (test, pilot, production)
 * @returns {Promise<Object>} DID Document
 */
export async function resolveDID(did, environment = "pilot") {
  if (!did) {
    throw new Error("DID is required");
  }

  const hosts = {
    test: "api-test.ebsi.eu",
    pilot: "api-pilot.ebsi.eu",
    production: "api.ebsi.eu",
  };

  const host = hosts[environment] || hosts.pilot;
  const EBSI_DID_REGISTRY = `https://${host}/did-registry/v5/identifiers`;

  try {
    const response = await fetch(`${EBSI_DID_REGISTRY}/${encodeURIComponent(did)}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`DID not found: ${did}`);
      }
      throw new Error(`DID resolution failed: ${response.status} ${response.statusText}`);
    }

    const didDocument = await response.json();

    // Validazione base del DID Document
    if (!didDocument.id || !didDocument.verificationMethod) {
      throw new Error("Invalid DID Document structure");
    }

    return didDocument;
  } catch (error) {
    console.error("APP-EBSI: Error resolving DID:", error);
    throw error;
  }
}

/**
 * Verifica se un DID esiste sul registro EBSI
 * @param {string} did - DID da verificare
 * @param {string} environment - Ambiente EBSI
 * @returns {Promise<boolean>} True se il DID esiste
 */
export async function isDIDRegistered(did, environment = "pilot") {
  try {
    await resolveDID(did, environment);
    return true;
  } catch (error) {
    if (error.message.includes("not found")) {
      return false;
    }
    throw error;
  }
}

/**
 * Risolve un DID con fallback su cache locale
 * @param {string} did - DID da risolvere
 * @param {Function} getCachedDocument - Funzione per recuperare cache
 * @param {string} environment - Ambiente EBSI
 * @returns {Promise<Object>} DID Document
 */
export async function resolveDIDWithCache(did, getCachedDocument, environment = "pilot") {
  try {
    // Prova prima con la rete
    return await resolveDID(did, environment);
  } catch (error) {
    console.warn(`Network resolution failed for ${did}, trying cache...`);

    // Fallback su cache locale
    if (getCachedDocument) {
      const cached = await getCachedDocument(did);
      if (cached) {
        console.log(`Using cached DID Document for ${did}`);
        return cached;
      }
    }

    throw error;
  }
}
