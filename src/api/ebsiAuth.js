import { EBSIClient } from "./ebsiClient.js";
import { signJWT } from "../crypto/jwtSigner.js";

/**
 * Autentica con EBSI e ottiene bearer token
 * @param {string} did - DID del wallet
 * @param {Uint8Array} privateKey - Chiave privata per firma
 * @returns {Promise<string>} Bearer token
 */
export async function authenticateEBSI(did, privateKey) {
  const client = new EBSIClient();

  // 1. Request challenge
  const challenge = await client._request("/users/v1/sessions", {
    method: "POST",
    body: JSON.stringify({ did }),
  });

  // 2. Sign challenge
  const signedToken = await signJWT(
    {
      iss: did,
      aud: `https://${import.meta.env.VITE_HOST || "api-pilot.ebsi.eu"}`,
      nonce: challenge.nonce,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300, // 5 min
    },
    privateKey
  );

  // 3. Exchange for access token
  const tokenResponse = await client._request("/users/v1/sessions/token", {
    method: "POST",
    body: JSON.stringify({ signedChallenge: signedToken }),
  });

  return tokenResponse.accessToken;
}

/**
 * Session manager per mantenere token valido
 */
export class EBSISession {
  constructor(did, privateKey) {
    this.did = did;
    this.privateKey = privateKey;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Ottiene token valido (refresh se necessario)
   * @returns {Promise<string>} Access token
   */
  async getValidToken() {
    const now = Date.now();

    // Token valido
    if (this.accessToken && this.tokenExpiry && now < this.tokenExpiry) {
      return this.accessToken;
    }

    // Refresh token
    this.accessToken = await authenticateEBSI(this.did, this.privateKey);
    this.tokenExpiry = now + 4 * 60 * 1000; // 4 min (margine di 1 min)

    return this.accessToken;
  }

  /**
   * Crea client autenticato
   * @returns {Promise<EBSIClient>} Client con token
   */
  async getAuthenticatedClient() {
    const token = await this.getValidToken();
    return new EBSIClient(token);
  }

  /**
   * Invalida sessione
   */
  invalidate() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }
}
