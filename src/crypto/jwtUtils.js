import { p256 } from "@noble/curves/nist.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { getPrivateKey } from "../storage/didStorage.js";
import { getKeyIdFromDID } from "../identity/didManager.js";

/**
 * Converte oggetto in base64url encoding
 * @param {Object} obj - Oggetto da encodare
 * @returns {string} String base64url encoded
 */
function base64urlEncode(obj) {
  const json = JSON.stringify(obj);
  const base64 = btoa(json);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Firma un JWT con la chiave privata del wallet
 * @param {Object} header - JWT header
 * @param {Object} payload - JWT payload
 * @returns {Promise<string>} JWT firmato
 */
export async function signJWT(header, payload) {
  try {
    // Recupera la chiave privata
    const privateKeyJwk = await getPrivateKey();
    if (!privateKeyJwk) {
      throw new Error("Private key not found. Please initialize wallet first.");
    }

    // Encode header e payload
    const encodedHeader = base64urlEncode(header);
    const encodedPayload = base64urlEncode(payload);

    // Crea signing input
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    // Converti signing input in bytes
    const messageBytes = new TextEncoder().encode(signingInput);
    const messageHash = sha256(messageBytes);

    // Converti chiave privata JWK in bytes
    const privateKeyBytes = base64urlToBytes(privateKeyJwk.d);

    // Firma con P-256 in formato raw (IEEE P1363 r+s per ES256)
    const signature = await p256.sign(messageHash, privateKeyBytes, { der: false });

    // Converti signature in base64url
    const signatureBase64url = bytesToBase64url(signature);

    // Costruisci JWT completo
    const jwt = `${signingInput}.${signatureBase64url}`;

    return jwt;
  } catch (error) {
    console.error("Error signing JWT:", error);
    throw new Error(`Failed to sign JWT: ${error.message}`);
  }
}

/**
 * Verifica un JWT (senza chiave pubblica esterna)
 * @param {string} jwt - JWT da verificare
 * @param {Object} publicKeyJwk - Chiave pubblica JWK per verifica
 * @returns {Promise<Object>} Payload decodificato se valido
 */
export async function verifyJWT(jwt, publicKeyJwk) {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    // Decode header e payload
    const header = JSON.parse(atob(encodedHeader.replace(/-/g, "+").replace(/_/g, "/")));
    const payload = JSON.parse(atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/")));

    // Ricostruisci signing input
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const messageBytes = new TextEncoder().encode(signingInput);
    const messageHash = sha256(messageBytes);

    // Decode signature
    const signature = base64urlToBytes(encodedSignature);

    // Converti chiave pubblica JWK in bytes (compressed format)
    const publicKeyBytes = jwkToPublicKeyBytes(publicKeyJwk);

    // Verifica signature
    const isValid = p256.verify(signature, messageHash, publicKeyBytes);

    if (!isValid) {
      throw new Error("Invalid signature");
    }

    return { header, payload };
  } catch (error) {
    console.error("Error verifying JWT:", error);
    throw new Error(`Failed to verify JWT: ${error.message}`);
  }
}

/**
 * Decodifica un JWT senza verificare la firma
 * @param {string} jwt - JWT da decodificare
 * @returns {Object} Header e payload decodificati
 */
export function decodeJWT(jwt) {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    const [encodedHeader, encodedPayload] = parts;

    const header = JSON.parse(atob(encodedHeader.replace(/-/g, "+").replace(/_/g, "/")));
    const payload = JSON.parse(atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/")));

    return { header, payload };
  } catch (error) {
    console.error("Error decoding JWT:", error);
    throw new Error(`Failed to decode JWT: ${error.message}`);
  }
}

/**
 * Converte bytes in base64url string
 * @param {Uint8Array} bytes - Bytes da convertire
 * @returns {string} Base64url string
 */
function bytesToBase64url(bytes) {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Converte base64url string in bytes
 * @param {string} base64url - Base64url string
 * @returns {Uint8Array} Bytes
 */
function base64urlToBytes(base64url) {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(paddedBase64);
  return new Uint8Array(binary.split("").map((c) => c.charCodeAt(0)));
}

/**
 * Converte JWK in bytes della chiave pubblica (compressed format)
 * @param {Object} jwk - Chiave pubblica JWK
 * @returns {Uint8Array} Public key bytes
 */
function jwkToPublicKeyBytes(jwk) {
  // Converti x e y coordinate in bytes
  const x = base64urlToBytes(jwk.x);
  const y = base64urlToBytes(jwk.y);

  // Crea uncompressed public key (0x04 prefix + x + y)
  const uncompressed = new Uint8Array(1 + x.length + y.length);
  uncompressed[0] = 0x04;
  uncompressed.set(x, 1);
  uncompressed.set(y, 1 + x.length);

  return uncompressed;
}

/**
 * Crea un JWT ID Token per autenticazione DID
 * @param {string} issuerDid - DID del holder/wallet
 * @param {string} audience - Client ID del destinatario
 * @param {string} nonce - Nonce dalla richiesta
 * @returns {Promise<string>} JWT ID Token firmato
 */
export async function createIDToken(issuerDid, audience, nonce) {
  const header = {
    alg: "ES256",
    typ: "JWT",
    kid: getKeyIdFromDID(issuerDid),
  };

  const payload = {
    iss: issuerDid,
    sub: issuerDid,
    aud: audience,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 600, // 10 minuti
    nonce: nonce,
  };

  return await signJWT(header, payload);
}

/**
 * Crea un JWT Proof per Credential Request
 * @param {string} issuerDid - DID del holder/wallet
 * @param {string} audience - Credential issuer URL
 * @param {string} nonce - c_nonce dal token response
 * @returns {Promise<string>} JWT Proof firmato
 */
export async function createProofJWT(issuerDid, audience, nonce) {
  const header = {
    alg: "ES256",
    typ: "openid4vci-proof+jwt",
    kid: getKeyIdFromDID(issuerDid),
  };

  const payload = {
    iss: issuerDid,
    aud: audience,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 600, // 10 minuti
    nonce: nonce,
  };

  return await signJWT(header, payload);
}

/**
 * Crea una Verifiable Presentation JWT
 * @param {Array} credentials - Array di credenziali da includere
 * @param {string} holderDid - DID del holder
 * @param {string} nonce - Nonce dalla presentation request
 * @param {string} audience - Verifier client_id
 * @returns {Promise<string>} VP JWT firmato
 */
export async function createVPToken(credentials, holderDid, nonce, audience) {
  const vp = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiablePresentation"],
    holder: holderDid,
    verifiableCredential: credentials,
  };

  const header = {
    alg: "ES256",
    typ: "JWT",
    kid: getKeyIdFromDID(holderDid),
  };

  const payload = {
    iss: holderDid,
    sub: holderDid,
    aud: audience,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 600, // 10 minuti
    nonce: nonce,
    vp: vp,
  };

  return await signJWT(header, payload);
}
