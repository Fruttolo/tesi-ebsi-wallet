import { createAgeProof, verifyAgeProof } from "../credentials/zkp/ageProof.js";
import { createSelectivePresentation } from "../credentials/selective/selectiveVC.js";
import { vpManager } from "../credentials/vpManager.js";

/**
 * Crea presentation per verifica età
 * @param {Object} credential - VC con data di nascita
 * @param {number} minAge - Età minima richiesta
 * @param {Object} verifierRequest - Richiesta dal verifier
 * @returns {Promise<Object>} VP con age proof
 */
export async function createAgeVerificationPresentation(credential, minAge, verifierRequest) {
  const { challenge, domain, verifierId } = verifierRequest;

  // Estrai data di nascita dalla credenziale
  const dateOfBirth = credential.credentialSubject.dateOfBirth;

  if (!dateOfBirth) {
    throw new Error("Credential does not contain dateOfBirth");
  }

  // Crea ZK proof per age >= minAge
  const secret = crypto.getRandomValues(new Uint8Array(32));
  const ageProof = createAgeProof(dateOfBirth, minAge, secret);

  // Crea VP con selective disclosure
  // Rivela SOLO che l'utente ha una credenziale valida
  // NON rivela data di nascita o altri attributi
  const vp = await createSelectivePresentation(
    credential,
    [], // Non rivelare alcun attributo
    {
      holder: credential.credentialSubject.id,
      challenge,
      domain,
    }
  );

  // Aggiungi age proof alla VP
  vp.proof = vp.proof || [];
  if (!Array.isArray(vp.proof)) {
    vp.proof = [vp.proof];
  }
  vp.proof.push({
    type: "AgeVerificationProof",
    created: new Date().toISOString(),
    proofPurpose: "authentication",
    verificationMethod: `${credential.credentialSubject.id}#key-1`,
    challenge,
    domain,
    ageProof: ageProof,
    minAge: minAge,
  });

  return vp;
}

/**
 * Verifica age verification presentation (lato verifier)
 * @param {Object} presentation - VP ricevuta
 * @param {number} minAge - Età minima richiesta
 * @param {string} challenge - Challenge inviato
 * @returns {Promise<Object>} Risultato verifica
 */
export async function verifyAgeVerificationPresentation(presentation, minAge, challenge) {
  const errors = [];

  // 1. Verifica struttura VP
  if (!presentation.verifiableCredential || presentation.verifiableCredential.length === 0) {
    errors.push("No credentials in presentation");
    return { valid: false, errors };
  }

  // 2. Trova age proof
  const ageProof = presentation.proof?.find((p) => p.type === "AgeVerificationProof");

  if (!ageProof) {
    errors.push("Age proof not found");
    return { valid: false, errors };
  }

  // 3. Verifica challenge match
  if (ageProof.challenge !== challenge) {
    errors.push("Challenge mismatch");
    return { valid: false, errors };
  }

  // 4. Verifica age proof
  const proofValid = verifyAgeProof(ageProof.ageProof);
  if (!proofValid) {
    errors.push("Invalid age proof");
    return { valid: false, errors };
  }

  // 5. Verifica issuer è trusted (EBSI)
  const credential = presentation.verifiableCredential[0];
  const issuerTrusted = await verifyIssuerTrusted(credential.issuer);

  if (!issuerTrusted) {
    errors.push("Issuer not trusted");
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    holder: presentation.holder,
    minAge: minAge,
    verified: true,
  };
}

/**
 * Verifica issuer è trusted su EBSI
 * @private
 */
async function verifyIssuerTrusted(issuerDID) {
  // TODO: Check EBSI trusted issuers registry
  return true; // Placeholder
}
