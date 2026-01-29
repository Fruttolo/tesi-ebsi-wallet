/**
 * Parser per diversi formati di VC
 */

/**
 * Parse VC JWT format
 * @param {string} jwt - JWT credential
 * @returns {Object} Parsed credential
 */
export function parseJWTCredential(jwt) {
  const parts = jwt.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const payload = JSON.parse(atob(parts[1]));

  // JWT VC structure
  return {
    "@context": payload.vc?.["@context"] || ["https://www.w3.org/2018/credentials/v1"],
    type: payload.vc?.type || ["VerifiableCredential"],
    issuer: payload.iss,
    issuanceDate: new Date(payload.iat * 1000).toISOString(),
    expirationDate: payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined,
    credentialSubject: payload.vc?.credentialSubject || {},
    proof: {
      type: "JwtProof2020",
      jwt: jwt,
    },
  };
}

/**
 * Parse VC JSON-LD format
 * @param {Object} credential - JSON-LD credential
 * @returns {Object} Normalized credential
 */
export function parseJSONLDCredential(credential) {
  // Già in formato JSON-LD standard
  return credential;
}

/**
 * Detect e parse credential format
 * @param {string|Object} credential - Credential in any format
 * @returns {Object} Parsed credential
 */
export function parseCredential(credential) {
  // String -> JWT
  if (typeof credential === "string") {
    return parseJWTCredential(credential);
  }

  // Object with JWT
  if (credential.proof?.jwt) {
    return parseJWTCredential(credential.proof.jwt);
  }

  // Object JSON-LD
  return parseJSONLDCredential(credential);
}

/**
 * Extract claims da credenziale
 * @param {Object} credential - VC
 * @returns {Object} Claims estratte
 */
export function extractClaims(credential) {
  const claims = {};
  const subject = credential.credentialSubject;

  for (const [key, value] of Object.entries(subject)) {
    if (key !== "id") {
      claims[key] = value;
    }
  }

  return claims;
}

/**
 * Valida la struttura di base di una VC secondo standard W3C
 * @param {Object} credential - La credenziale da validare
 * @returns {{valid: boolean, errors: string[]}} Risultato validazione
 */
export function validateCredentialStructure(credential) {
  const errors = [];

  if (!credential) {
    errors.push("Credenziale vuota o non definita");
    return { valid: false, errors };
  }

  if (!credential["@context"]) {
    errors.push("Campo @context mancante");
  } else if (!Array.isArray(credential["@context"])) {
    errors.push("@context deve essere un array");
  } else if (!credential["@context"].includes("https://www.w3.org/2018/credentials/v1")) {
    errors.push("@context deve includere https://www.w3.org/2018/credentials/v1");
  }

  if (!credential.type) {
    errors.push("Campo type mancante");
  } else if (!Array.isArray(credential.type)) {
    errors.push("type deve essere un array");
  } else if (!credential.type.includes("VerifiableCredential")) {
    errors.push("type deve includere VerifiableCredential");
  }

  if (!credential.issuer) {
    errors.push("Campo issuer mancante");
  }

  if (!credential.issuanceDate) {
    errors.push("Campo issuanceDate mancante");
  }

  if (!credential.credentialSubject) {
    errors.push("Campo credentialSubject mancante");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Estrae il DID dell'issuer
 * @param {Object} credential - La credenziale
 * @returns {string|null} DID dell'issuer
 */
export function extractIssuerDID(credential) {
  if (!credential || !credential.issuer) {
    return null;
  }

  if (typeof credential.issuer === "string") {
    return credential.issuer;
  }

  if (typeof credential.issuer === "object" && credential.issuer.id) {
    return credential.issuer.id;
  }

  return null;
}

/**
 * Estrae il DID del subject
 * @param {Object} credential - La credenziale
 * @returns {string|null} DID del subject
 */
export function extractSubjectDID(credential) {
  if (!credential || !credential.credentialSubject) {
    return null;
  }

  return credential.credentialSubject.id || null;
}

/**
 * Verifica se la credenziale è scaduta
 * @param {Object} credential - La credenziale
 * @returns {boolean} True se scaduta
 */
export function isCredentialExpired(credential) {
  if (!credential || !credential.expirationDate) {
    return false;
  }

  try {
    const expirationDate = new Date(credential.expirationDate);
    const now = new Date();
    return now > expirationDate;
  } catch {
    return false;
  }
}

/**
 * Calcola giorni rimanenti prima della scadenza
 * @param {Object} credential - La credenziale
 * @returns {number|null} Giorni rimanenti o null
 */
export function getDaysUntilExpiration(credential) {
  if (!credential || !credential.expirationDate) {
    return null;
  }

  try {
    const expirationDate = new Date(credential.expirationDate);
    const now = new Date();
    const diffTime = expirationDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return null;
  }
}

/**
 * Categorizza la credenziale
 * @param {Object} credential - La credenziale
 * @returns {string} Categoria
 */
export function categorizeCredential(credential) {
  if (!credential || !credential.type) {
    return "other";
  }

  const types = credential.type.map((t) => t.toLowerCase());

  if (types.some((t) => t.includes("education") || t.includes("diploma") || t.includes("degree"))) {
    return "education";
  }

  if (types.some((t) => t.includes("identity") || t.includes("id"))) {
    return "identity";
  }

  if (types.some((t) => t.includes("employment") || t.includes("work"))) {
    return "employment";
  }

  if (types.some((t) => t.includes("certificate") || t.includes("certification"))) {
    return "certification";
  }

  if (types.some((t) => t.includes("license"))) {
    return "license";
  }

  return "other";
}

/**
 * Genera un ID univoco per la credenziale
 * @param {Object} credential - La credenziale
 * @returns {string} ID univoco
 */
export function generateCredentialId(credential) {
  if (credential.id) {
    return credential.id;
  }

  const issuer = extractIssuerDID(credential) || "unknown";
  const timestamp = credential.issuanceDate || Date.now();
  const types = credential.type ? credential.type.join("-") : "vc";

  return `vc:${types}:${issuer.substring(0, 10)}:${timestamp}`.replace(/[^a-zA-Z0-9:-]/g, "");
}

/**
 * Formatta credenziale per display UI
 * @param {Object} credential - La credenziale
 * @returns {Object} Dati formattati
 */
export function formatCredentialForDisplay(credential) {
  return {
    id: generateCredentialId(credential),
    type: credential.type,
    category: categorizeCredential(credential),
    issuer: {
      did: extractIssuerDID(credential),
      name: credential.issuer?.name || "Unknown Issuer",
    },
    subject: {
      did: extractSubjectDID(credential),
    },
    attributes: extractClaims(credential),
    issuanceDate: credential.issuanceDate,
    expirationDate: credential.expirationDate || null,
    expired: isCredentialExpired(credential),
    daysUntilExpiration: getDaysUntilExpiration(credential),
    hasProof: !!credential.proof,
    raw: credential,
  };
}
