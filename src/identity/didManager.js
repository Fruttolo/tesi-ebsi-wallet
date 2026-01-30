import { util } from "@cef-ebsi/key-did-resolver";

// Re-export funzioni di storage per convenienza
export { getDIDDocument, saveDIDDocument, getDID, saveDID } from "../storage/didStorage.js";

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
 * Crea DID Document
 * @param {string} did - DID identifier
 * @param {Object} publicKeyJwk - Chiave pubblica in formato JWK
 * @returns {Object} DID Document
 */
export function createDIDDocument(did, publicKeyJwk) {
  if (!did || !publicKeyJwk) {
    throw new Error("DID and public key are required");
  }

  // Usa il formato standard per key ID
  const keyId = getKeyIdFromDID(did);

  return {
    "@context": ["https://www.w3.org/ns/did/v1", "https://w3id.org/security/suites/jws-2020/v1"],
    id: did,
    verificationMethod: [
      {
        id: keyId,
        type: "JsonWebKey2020",
        controller: did,
        publicKeyJwk: publicKeyJwk,
      },
    ],
    authentication: [keyId],
    assertionMethod: [keyId],
    keyAgreement: [keyId],
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

  // Per did:key, il fragment deve essere il fingerprint (parte dopo did:key:)
  // perché la libreria @cef-ebsi/key-did-resolver genera DID documents con questo formato
  // Il kid nel JWT deve corrispondere esattamente al verification method ID nel DID document

  if (did.startsWith("did:key:")) {
    // Estrai il fingerprint (tutto dopo "did:key:")
    const fingerprint = did.replace("did:key:", "");
    return `${did}#${fingerprint}`;
  } else if (did.startsWith("did:ebsi:")) {
    // Per did:ebsi, usa il formato standard keys-1
    return `${did}#keys-1`;
  } else {
    // Fallback generico
    return `${did}#key-1`;
  }
}
