import {
  createAgeVerificationPresentation,
  verifyAgeVerificationPresentation,
} from "../usecases/ageVerification.js";
import { createSelectivePresentation } from "../credentials/selective/selectiveVC.js";

/**
 * Presentation Exchange Protocol
 * Implementazione semplificata di DIF Presentation Exchange
 */

/**
 * Crea richiesta di presentazione (verifier side)
 * @param {Object} requirements - Requisiti richiesti
 * @returns {Object} Presentation Request
 */
export function createPresentationRequest(requirements) {
  const { purpose, minAge, credentialType, trustedIssuers = [] } = requirements;

  return {
    type: "PresentationRequest",
    version: "1.0.0",
    id: generateRequestId(),
    created: new Date().toISOString(),
    purpose: purpose || "Age verification",
    challenge: generateChallenge(),
    domain: typeof window !== "undefined" ? window.location.origin : "https://localhost",
    requirements: {
      constraints: {
        fields: minAge
          ? [
              {
                path: ["$.credentialSubject.dateOfBirth"],
                filter: {
                  type: "ageOver",
                  minimum: minAge,
                },
              },
            ]
          : [],
        credentialType: credentialType || ["VerifiableCredential"],
        trustedIssuers,
      },
    },
  };
}

/**
 * Valida richiesta di presentazione (wallet side)
 * @param {Object} request - Richiesta ricevuta
 * @returns {Object} Risultato validazione
 */
export function validatePresentationRequest(request) {
  const errors = [];

  if (!request.type || request.type !== "PresentationRequest") {
    errors.push("Invalid request type");
  }

  if (!request.challenge) {
    errors.push("Missing challenge");
  }

  if (!request.requirements) {
    errors.push("Missing requirements");
  }

  // Verifica domain è HTTPS (in produzione)
  if (
    request.domain &&
    !request.domain.startsWith("https://") &&
    !request.domain.startsWith("http://localhost")
  ) {
    errors.push("Domain must use HTTPS");
  }

  return {
    valid: errors.length === 0,
    errors,
    requirements: request.requirements,
  };
}

/**
 * Processa richiesta e crea response (wallet side)
 * @param {Object} request - Richiesta da processare
 * @param {Object} credential - Credenziale da usare
 * @param {Object} walletKeys - Chiavi wallet
 * @returns {Promise<Object>} Presentation Response
 */
export async function createPresentationResponse(request, credential, walletKeys) {
  // Valida richiesta
  const validation = validatePresentationRequest(request);
  if (!validation.valid) {
    throw new Error(`Invalid request: ${validation.errors.join(", ")}`);
  }

  // Estrai requisiti
  const requirements = request.requirements.constraints;

  // Identifica tipo di verifica richiesta
  const ageField = requirements.fields?.find((f) => f.path.includes("dateOfBirth"));

  let presentation;

  if (ageField && ageField.filter.type === "ageOver") {
    // Verifica età con ZK proof
    const minAge = ageField.filter.minimum;
    presentation = await createAgeVerificationPresentation(credential, minAge, {
      challenge: request.challenge,
      domain: request.domain,
      verifierId: request.verifier,
    });
  } else {
    // Presentazione standard
    presentation = await createSelectivePresentation(
      credential,
      requirements.fields?.map((f) => extractFieldName(f.path)) || [],
      {
        holder: credential.credentialSubject.id,
        challenge: request.challenge,
        domain: request.domain,
        privateKey: walletKeys.privateKey,
      }
    );
  }

  return {
    type: "PresentationResponse",
    requestId: request.id,
    created: new Date().toISOString(),
    presentation: presentation,
  };
}

/**
 * Verifica response (verifier side)
 * @param {Object} response - Response ricevuta
 * @param {Object} originalRequest - Richiesta originale
 * @returns {Promise<Object>} Risultato verifica
 */
export async function verifyPresentationResponse(response, originalRequest) {
  // Verifica request ID match
  if (response.requestId !== originalRequest.id) {
    return {
      valid: false,
      error: "Request ID mismatch",
    };
  }

  const presentation = response.presentation;

  // Verifica challenge
  const challenge = originalRequest.challenge;

  // Determina tipo verifica
  const requirements = originalRequest.requirements.constraints;
  const ageField = requirements.fields?.find((f) => f.path.includes("dateOfBirth"));

  if (ageField && ageField.filter.type === "ageOver") {
    // Verifica age proof
    return await verifyAgeVerificationPresentation(
      presentation,
      ageField.filter.minimum,
      challenge
    );
  } else {
    // Verifica standard - placeholder
    return {
      valid: true,
      errors: [],
    };
  }
}

/**
 * Genera challenge casuale
 * @private
 */
function generateChallenge() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Genera ID richiesta
 * @private
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Estrai nome field da JSON path
 * @private
 */
function extractFieldName(path) {
  const match = path[0].match(/\$\.credentialSubject\.(\w+)/);
  return match ? match[1] : null;
}
