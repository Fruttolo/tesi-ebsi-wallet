import * as secp256k1 from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha2.js";

/**
 * Base64URL encoding (senza padding)
 * @param {Uint8Array} buffer - Buffer da encodare
 * @returns {string} String base64url
 */
function base64urlEncode(buffer) {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Converte chiave pubblica in formato JWK
 * @param {Uint8Array} publicKey - Chiave pubblica (33 o 65 bytes)
 * @returns {Object} JWK object
 */
export function publicKeyToJWK(publicKey) {
  // Assicurati che sia in formato uncompressed (65 bytes)
  let uncompressed;
  if (publicKey.length === 33) {
    // Decomprimi se necessario
    const point = secp256k1.ProjectivePoint.fromHex(publicKey);
    uncompressed = point.toRawBytes(false);
  } else {
    uncompressed = publicKey;
  }

  // Rimuovi il prefix byte (0x04)
  const x = uncompressed.slice(1, 33);
  const y = uncompressed.slice(33, 65);

  return {
    kty: "EC",
    crv: "secp256k1",
    x: base64urlEncode(x),
    y: base64urlEncode(y),
  };
}

/**
 * Firma JWT con chiave privata secp256k1
 * @param {Object} payload - JWT payload
 * @param {Uint8Array} privateKey - Chiave privata (32 bytes)
 * @param {Object} header - JWT header (opzionale)
 * @returns {Promise<string>} JWT firmato
 */
export async function signJWT(payload, privateKey, header = {}) {
  // Header di default
  const jwtHeader = {
    alg: "ES256K",
    typ: "JWT",
    ...header,
  };

  // Encode header e payload
  const encodedHeader = base64urlEncode(new TextEncoder().encode(JSON.stringify(jwtHeader)));
  const encodedPayload = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));

  // Crea signing input
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const messageHash = sha256(new TextEncoder().encode(signingInput));

  // Firma con secp256k1
  const signature = await secp256k1.signAsync(messageHash, privateKey, {
    der: false,
  });

  // Encode signature
  const encodedSignature = base64urlEncode(signature);

  // Costruisci JWT
  return `${signingInput}.${encodedSignature}`;
}

/**
 * Verifica JWT (senza validare timestamp)
 * @param {string} jwt - JWT da verificare
 * @param {Uint8Array} publicKey - Chiave pubblica (33 o 65 bytes)
 * @returns {Promise<Object>} Payload decodificato se valido
 */
export async function verifyJWT(jwt, publicKey) {
  const parts = jwt.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  // Decode header e payload
  const header = JSON.parse(new TextDecoder().decode(base64urlDecode(encodedHeader)));
  const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(encodedPayload)));

  // Verifica algoritmo
  if (header.alg !== "ES256K") {
    throw new Error(`Unsupported algorithm: ${header.alg}`);
  }

  // Verifica firma
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const messageHash = sha256(new TextEncoder().encode(signingInput));
  const signature = base64urlDecode(encodedSignature);

  const isValid = await secp256k1.verify(signature, messageHash, publicKey);

  if (!isValid) {
    throw new Error("Invalid signature");
  }

  return payload;
}

/**
 * Base64URL decoding
 * @param {string} str - String base64url
 * @returns {Uint8Array} Buffer decodificato
 */
function base64urlDecode(str) {
  // Converti da base64url a base64
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  // Aggiungi padding se necessario
  while (base64.length % 4) {
    base64 += "=";
  }
  // Decode
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodifica JWT senza verificare la firma
 * @param {string} jwt - JWT da decodificare
 * @returns {Object} {header, payload, signature}
 */
export function decodeJWT(jwt) {
  const parts = jwt.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  return {
    header: JSON.parse(new TextDecoder().decode(base64urlDecode(parts[0]))),
    payload: JSON.parse(new TextDecoder().decode(base64urlDecode(parts[1]))),
    signature: parts[2],
  };
}
