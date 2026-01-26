import { util } from "@cef-ebsi/key-did-resolver";
import bs58 from "bs58";
import { sha256 } from "@noble/hashes/sha2.js";

/**
 * Genera DID did:key dal publicKeyJwk usando libreria EBSI
 * @param {Object} publicKeyJwk - Chiave pubblica in formato JWK
 * @returns {string} DID in formato did:key:z...
 */
export function generateDID(publicKeyJwk) {
  if (!publicKeyJwk || !publicKeyJwk.kty || !publicKeyJwk.x || !publicKeyJwk.y) {
    throw new Error("Invalid public key JWK");
  }

  // Usa utility EBSI per creare DID
  const did = util.createDid(publicKeyJwk);

  if (!did || !did.startsWith("did:key:")) {
    throw new Error("Failed to create valid DID");
  }

  return did;
}

/**
 * Genera DID did:ebsi alternativo dal publicKey (hash-based)
 * Questo è un metodo alternativo per generare DID ebsi
 * @param {Uint8Array} publicKey - Chiave pubblica
 * @returns {string} DID in formato did:ebsi:z...
 */
export function generateEBSIDID(publicKey) {
  // Hash della chiave pubblica
  const hash = sha256(publicKey);

  // Prendi primi 20 bytes
  const identifier = hash.slice(0, 20);

  // Encoding base58btc
  const encoded = bs58.encode(identifier);

  return `did:ebsi:z${encoded}`;
}

/**
 * Crea DID Document
 * @param {string} did - DID identifier
 * @param {Object} publicKeyJwk - Chiave pubblica in formato JWK
 * @returns {Object} DID Document
 */
export function createDIDDocument(did, publicKeyJwk) {
  if (!did || !publicKeyJwk) {
    throw new Error("DID and public key are required");
  }

  return {
    "@context": ["https://www.w3.org/ns/did/v1", "https://w3id.org/security/suites/jws-2020/v1"],
    id: did,
    verificationMethod: [
      {
        id: `${did}#key-1`,
        type: "JsonWebKey2020",
        controller: did,
        publicKeyJwk: publicKeyJwk,
      },
    ],
    authentication: [`${did}#key-1`],
    assertionMethod: [`${did}#key-1`],
  };
}

/**
 * Estrae il key ID da un DID per l'uso in JWT
 * @param {string} did - DID completo
 * @returns {string} Key ID (kid)
 */
export function getKeyIdFromDID(did) {
  if (!did) {
    throw new Error("DID is required");
  }

  // Per did:key, il fragment è tipicamente il fingerprint senza il prefisso
  const fragment = did.startsWith("did:key:") ? did.replace("did:key:", "") : "key-1";
  return `${did}#${fragment}`;
}
