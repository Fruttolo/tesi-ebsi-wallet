import { HDKey } from "@scure/bip32";
import { p256 } from "@noble/curves/nist.js";

/**
 * Converte Uint8Array in base64url
 * @param {Uint8Array} bytes - Array di byte
 * @returns {string} Base64url string
 */
function uint8ToBase64Url(bytes) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  // browser fallback
  let binary = "";
  const len = bytes.length;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Deriva una chiave privata dal seed usando BIP32
 * @param {Uint8Array} seed - Seed BIP39
 * @param {string} path - Derivation path (es. "m/44'/0'/0'/0/0")
 * @returns {Uint8Array} Chiave privata
 */
export function derivePrivateKey(seed, path = "m/0'/0'/0'") {
  const hdKey = HDKey.fromMasterSeed(seed);
  const derivedKey = hdKey.derive(path);

  if (!derivedKey.privateKey) {
    throw new Error("Failed to derive private key from seed");
  }

  if (derivedKey.privateKey.length !== 32) {
    throw new Error("Unsupported private key length");
  }

  return derivedKey.privateKey;
}

/**
 * Ottiene chiave pubblica da privata (P-256)
 * @param {Uint8Array} privateKey - Chiave privata
 * @param {boolean} compressed - Se true, restituisce formato compresso
 * @returns {Uint8Array} Chiave pubblica
 */
export function getPublicKey(privateKey, compressed = false) {
  return p256.getPublicKey(privateKey, compressed);
}

/**
 * Converte chiave pubblica in formato hex
 * @param {Uint8Array} publicKey - Chiave pubblica
 * @returns {string} Hex string
 */
export function publicKeyToHex(publicKey) {
  return Buffer.from(publicKey).toString("hex");
}

/**
 * Crea JWK (JSON Web Key) da chiave privata P-256
 * @param {Uint8Array} privateKey - Chiave privata (32 bytes)
 * @returns {Object} JWK con chiave privata e pubblica
 */
export function createJWK(privateKey) {
  if (!privateKey || privateKey.length !== 32) {
    throw new Error("Invalid private key: must be 32 bytes");
  }

  // Ottieni chiave pubblica non compressa (65 bytes: 0x04 + x + y)
  const pubUncompressed = p256.getPublicKey(privateKey, false);
  const x = pubUncompressed.slice(1, 33);
  const y = pubUncompressed.slice(33, 65);

  const d_b64 = uint8ToBase64Url(privateKey);
  const x_b64 = uint8ToBase64Url(x);
  const y_b64 = uint8ToBase64Url(y);

  const privateJwk = {
    kty: "EC",
    crv: "P-256",
    x: x_b64,
    y: y_b64,
    d: d_b64,
    alg: "ES256",
    ext: true,
  };

  const publicJwk = {
    kty: "EC",
    crv: "P-256",
    x: x_b64,
    y: y_b64,
    alg: "ES256",
    ext: true,
  };

  return { privateJwk, publicJwk };
}
