import {
  saveCredential,
  getAllCredentials,
  getCredentialById,
} from "../storage/credentialStorage.js";
import { verifyCredential } from "./verifier.js";

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

// Singleton instance
export const vcManager = new VCManager();
