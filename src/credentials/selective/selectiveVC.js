import { bbsManager } from "./bbsManager.js";
import { vpManager } from "../vpManager.js";

/**
 * Crea VP con selective disclosure BBS+
 * @param {Object} credential - VC originale con firma BBS+
 * @param {Array<string>} attributesToReveal - Attributi da rivelare
 * @param {Object} options - Opzioni
 * @returns {Promise<Object>} VP con proof derivato
 */
export async function createSelectivePresentation(credential, attributesToReveal, options = {}) {
  // 1. Estrai tutti i messaggi dalla credenziale
  const allMessages = bbsManager.credentialToMessages(credential);

  // 2. Identifica indici dei messaggi da rivelare
  const revealedIndices = getRevealedIndices(credential.credentialSubject, attributesToReveal);

  // 3. Estrai firma BBS+ originale
  const originalSignature = extractBBSSignature(credential);
  const issuerPublicKey = await getIssuerPublicKey(credential.issuer);

  // 4. Crea nonce per proof
  const nonce = options.challenge
    ? new TextEncoder().encode(options.challenge)
    : crypto.getRandomValues(new Uint8Array(32));

  // 5. Crea proof derivato
  const derivedProof = await bbsManager.createDerivedProof(
    originalSignature,
    issuerPublicKey,
    allMessages,
    revealedIndices,
    nonce
  );

  // 6. Costruisci credenziale derivata (solo attributi rivelati)
  const revealedMessages = revealedIndices.map((i) => allMessages[i]);
  const derivedCredential = {
    "@context": credential["@context"],
    type: credential.type,
    issuer: credential.issuer,
    issuanceDate: credential.issuanceDate,
    credentialSubject: {
      id: credential.credentialSubject.id,
      ...bbsManager.messagesToCredential(revealedMessages).credentialSubject,
    },
    proof: {
      type: "BbsBlsSignatureProof2020",
      created: new Date().toISOString(),
      proofPurpose: "assertionMethod",
      verificationMethod: `${credential.issuer}#bbs-key-1`,
      proofValue: Buffer.from(derivedProof).toString("base64"),
      nonce: Buffer.from(nonce).toString("base64"),
    },
  };

  // 7. Crea VP
  return await vpManager.createPresentation([derivedCredential], options);
}

/**
 * Identifica indici attributi da rivelare
 * @private
 */
function getRevealedIndices(credentialSubject, attributesToReveal) {
  const indices = [];
  const keys = Object.keys(credentialSubject).filter((k) => k !== "id");

  attributesToReveal.forEach((attr) => {
    const index = keys.indexOf(attr);
    if (index !== -1) {
      indices.push(index);
    }
  });

  return indices;
}

/**
 * Estrai firma BBS+ da credenziale
 * @private
 */
function extractBBSSignature(credential) {
  const proofValue = credential.proof.proofValue || credential.proof.signature;
  return Buffer.from(proofValue, "base64");
}

/**
 * Ottieni chiave pubblica issuer per BBS+
 * @private
 */
async function getIssuerPublicKey(issuerDID) {
  // TODO: Resolve DID e estrai BBS+ public key
  // Per ora placeholder
  return new Uint8Array(96); // BLS12-381 G2 public key size
}

/**
 * Verifica VP con selective disclosure
 * @param {Object} presentation - VP con proof BBS+
 * @returns {Promise<boolean>} True se valida
 */
export async function verifySelectivePresentation(presentation) {
  const credential = presentation.verifiableCredential[0];
  const proof = credential.proof;

  if (proof.type !== "BbsBlsSignatureProof2020") {
    throw new Error("Not a BBS+ proof");
  }

  // Estrai parametri
  const derivedProof = Buffer.from(proof.proofValue, "base64");
  const nonce = Buffer.from(proof.nonce, "base64");
  const issuerPublicKey = await getIssuerPublicKey(credential.issuer);

  // Estrai messaggi rivelati
  const revealedMessages = bbsManager.credentialToMessages(credential);

  // Verifica proof
  return await bbsManager.verifyDerivedProof(
    derivedProof,
    issuerPublicKey,
    revealedMessages,
    nonce
  );
}
