/**
 * PKCE (Proof Key for Code Exchange) utilities
 * RFC 7636: https://tools.ietf.org/html/rfc7636
 */

/**
 * Genera un code_verifier casuale
 * Deve essere una stringa URL-safe di lunghezza tra 43 e 128 caratteri
 * @returns {string} code_verifier
 */
export function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Genera il code_challenge a partire dal code_verifier
 * Usa il metodo S256 (SHA-256)
 * @param {string} codeVerifier
 * @returns {Promise<string>} code_challenge
 */
export async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}

/**
 * Codifica in base64url (RFC 4648 Section 5)
 * @param {Uint8Array} buffer
 * @returns {string}
 */
function base64UrlEncode(buffer) {
  let binary = "";
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Genera una stringa casuale per state o nonce
 * @returns {string}
 */
export function generateRandomString() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}
