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
