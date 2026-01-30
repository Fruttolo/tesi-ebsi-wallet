import {
  saveCredential,
  getAllCredentials,
  getCredentialById,
} from "../storage/credentialStorage.js";

/**
 * Manager per Verifiable Credentials
 */
export class VCManager {
  /**
   * Ricevi e valida una nuova credenziale
   * @param {Object} credential - VC da ricevere
   * @param {Object} options - Opzioni di validazione
   * @returns {Promise<Object>} Risultato validazione
   */
  async receiveCredential(credential, options = {}) {
    // 1. Parse e validazione struttura
    const parseResult = this.parseCredential(credential);
    if (!parseResult.valid) {
      throw new Error(`Invalid VC structure: ${parseResult.errors.join(", ")}`);
    }

    // 2. Verifica firma issuer
    const verifyResult = await verifyCredential(credential, options);
    if (!verifyResult.valid) {
      throw new Error(`Verification failed: ${verifyResult.error}`);
    }

    // 3. Salva localmente
    const savedId = await saveCredential(credential);

    return {
      success: true,
      credentialId: savedId,
      credential: credential,
      verification: verifyResult,
    };
  }

  /**
   * Parse e valida struttura VC
   * @param {Object} credential - VC da validare
   * @returns {Object} Risultato validazione
   */
  parseCredential(credential) {
    const errors = [];

    // Verifica campi obbligatori W3C
    if (!credential["@context"]) {
      errors.push("Missing @context");
    }

    if (!credential.type || !Array.isArray(credential.type)) {
      errors.push("Missing or invalid type");
    } else if (!credential.type.includes("VerifiableCredential")) {
      errors.push("type must include VerifiableCredential");
    }

    if (!credential.issuer) {
      errors.push("Missing issuer");
    }

    if (!credential.issuanceDate) {
      errors.push("Missing issuanceDate");
    }

    if (!credential.credentialSubject) {
      errors.push("Missing credentialSubject");
    }

    if (!credential.proof) {
      errors.push("Missing proof");
    }

    // Verifica formato date
    if (credential.issuanceDate && !this._isValidDate(credential.issuanceDate)) {
      errors.push("Invalid issuanceDate format");
    }

    if (credential.expirationDate && !this._isValidDate(credential.expirationDate)) {
      errors.push("Invalid expirationDate format");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Ottieni tutte le credenziali
   * @returns {Promise<Array>} Lista credenziali
   */
  async getCredentials() {
    return await getAllCredentials();
  }

  /**
   * Ottieni credenziale per ID
   * @param {string} id - ID credenziale
   * @returns {Promise<Object|null>} Credenziale
   */
  async getCredential(id) {
    return await getCredentialById(id);
  }

  /**
   * Conta le credenziali salvate
   * @returns {Promise<number>} Numero credenziali
   */
  async countCredentials() {
    const credentials = await this.getCredentials();
    return credentials.length || 0;
  }

  /**
   * Controlla se credenziale è scaduta
   * @param {Object} credential - VC da controllare
   * @returns {boolean} True se scaduta
   */
  isExpired(credential) {
    if (!credential.expirationDate) return false;
    return new Date(credential.expirationDate) < new Date();
  }

  /**
   * Ottieni metadata credenziale
   * @param {Object} credential - VC
   * @returns {Object} Metadata
   */
  getMetadata(credential) {
    // Defensive checks per gestire credenziali con struttura non standard
    const credentialSubject = credential.credentialSubject || {};
    const type = credential.type || ["VerifiableCredential"];
    const credentialTypes = Array.isArray(type) ? type : [type];

    return {
      id: credential.id || "unknown",
      type: credentialTypes,
      issuer: credential.issuer || "unknown",
      subject: credentialSubject.id || "unknown",
      issuanceDate: credential.issuanceDate || "",
      expirationDate: credential.expirationDate || null,
      expired: this.isExpired(credential),
      credentialType:
        credentialTypes.filter((t) => t !== "VerifiableCredential")[0] ||
        credentialTypes[0] ||
        "VerifiableCredential",
    };
  }

  /**
   * Valida formato data ISO 8601
   * @private
   */
  _isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }
}

/**
 * Verifica Verifiable Credential
 * @param {Object} credential - VC da verificare
 * @param {Object} options - Opzioni verifica
 * @returns {Promise<Object>} Risultato verifica
 */
export async function verifyCredential(credential, options = {}) {
  const errors = [];
  const warnings = [];

  try {
    // 1. Verifica struttura
    if (!credential.proof) {
      errors.push("Missing proof");
      return { valid: false, errors, warnings };
    }

    // 2. Resolve issuer DID
    const issuerDID =
      typeof credential.issuer === "string" ? credential.issuer : credential.issuer.id;

    let issuerDocument;
    try {
      issuerDocument = await resolveDID(issuerDID);
    } catch (error) {
      errors.push(`Cannot resolve issuer DID: ${error.message}`);
      return { valid: false, errors, warnings };
    }

    // 3. Verifica issuer è trusted (EBSI registry)
    if (options.checkTrustedIssuer !== false) {
      const ebsi = new EBSIClient();
      try {
        const isTrusted = await ebsi.isIssuerTrusted(issuerDID);

        if (!isTrusted) {
          warnings.push("Issuer is not in EBSI trusted registry");
        }
      } catch (error) {
        warnings.push(`Could not verify trusted issuer: ${error.message}`);
      }
    }

    // 4. Verifica firma
    const proof = credential.proof;
    let signatureValid = false;

    if (proof.type === "JsonWebSignature2020" || proof.jws) {
      // Verifica JWS
      signatureValid = await verifyJWS(credential, proof, issuerDocument);
    } else if (proof.jwt) {
      // Verifica JWT
      signatureValid = await verifyJWTSignature(proof.jwt, issuerDocument);
    } else {
      errors.push(`Unsupported proof type: ${proof.type}`);
      return { valid: false, errors, warnings };
    }

    if (!signatureValid) {
      errors.push("Invalid signature");
      return { valid: false, errors, warnings };
    }

    // 5. Verifica scadenza
    if (credential.expirationDate) {
      const expiry = new Date(credential.expirationDate);
      if (expiry < new Date()) {
        errors.push("Credential expired");
        return { valid: false, errors, warnings };
      }
    }

    // 6. Verifica revoca (TODO: implement revocation check)
    // const isRevoked = await checkRevocation(credential);
    // if (isRevoked) {
    //   errors.push('Credential has been revoked');
    //   return { valid: false, errors, warnings };
    // }

    return {
      valid: true,
      errors,
      warnings,
      issuer: issuerDID,
      subject: credential.credentialSubject.id,
    };
  } catch (error) {
    errors.push(`Verification error: ${error.message}`);
    return { valid: false, errors, warnings };
  }
}

// Singleton instance
export const vcManager = new VCManager();
