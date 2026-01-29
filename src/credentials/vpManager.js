import { signJWT } from "../crypto/jwtSigner.js";

/**
 * Genera nonce casuale
 * @returns {string} Nonce
 */
function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Manager per Verifiable Presentations
 */
export class VPManager {
  /**
   * Crea VP da VC selezionate
   * @param {Array<Object>} credentials - VC da includere
   * @param {Object} options - Opzioni VP
   * @returns {Promise<Object>} Verifiable Presentation
   */
  async createPresentation(credentials, options = {}) {
    const { holder, challenge = generateNonce(), domain, privateKey } = options;

    // Struttura VP base
    const vp = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://w3id.org/security/suites/jws-2020/v1",
      ],
      type: ["VerifiablePresentation"],
      holder: holder,
      verifiableCredential: credentials,
    };

    // Aggiungi challenge se presente (replay protection)
    if (challenge) {
      vp.challenge = challenge;
    }

    // Aggiungi domain binding
    if (domain) {
      vp.domain = domain;
    }

    // Firma VP
    if (privateKey) {
      const proof = await this._signPresentation(vp, holder, privateKey, challenge, domain);
      vp.proof = proof;
    }

    return vp;
  }

  /**
   * Crea VP in formato JWT
   * @param {Array<Object>} credentials - VC da includere
   * @param {Object} options - Opzioni
   * @returns {Promise<string>} VP JWT
   */
  async createPresentationJWT(credentials, options = {}) {
    const { holder, audience, challenge, privateKey } = options;

    const payload = {
      vp: {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiablePresentation"],
        verifiableCredential: credentials,
      },
      iss: holder,
      aud: audience,
      nonce: challenge,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300, // 5 min
    };

    return await signJWT(payload, privateKey);
  }

  /**
   * Firma presentation
   * @private
   */
  async _signPresentation(vp, holder, privateKey, challenge, domain) {
    // Crea payload per firma
    const payload = {
      ...vp,
      iss: holder,
      aud: domain,
      nonce: challenge,
      iat: Math.floor(Date.now() / 1000),
    };

    const jws = await signJWT(payload, privateKey);

    return {
      type: "JsonWebSignature2020",
      created: new Date().toISOString(),
      proofPurpose: "authentication",
      verificationMethod: `${holder}#key-1`,
      challenge: challenge,
      domain: domain,
      jws: jws,
    };
  }

  /**
   * Valida VP structure
   * @param {Object} presentation - VP da validare
   * @returns {boolean} True se valida
   */
  validatePresentationStructure(presentation) {
    return (
      presentation["@context"] &&
      presentation.type &&
      presentation.type.includes("VerifiablePresentation") &&
      presentation.verifiableCredential &&
      Array.isArray(presentation.verifiableCredential)
    );
  }
}

export const vpManager = new VPManager();
