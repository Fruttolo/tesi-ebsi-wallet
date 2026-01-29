import {
  generateBls12381G2KeyPair,
  blsSign,
  blsVerify,
  blsCreateProof,
  blsVerifyProof,
} from "@mattrglobal/bbs-signatures";

/**
 * Manager per BBS+ Signatures
 */
export class BBSManager {
  /**
   * Genera keypair BLS12-381 per BBS+
   * @param {Uint8Array} seed - Seed opzionale
   * @returns {Promise<Object>} { publicKey, secretKey }
   */
  async generateKeyPair(seed) {
    const keyPair = await generateBls12381G2KeyPair(seed);
    return {
      publicKey: keyPair.publicKey,
      secretKey: keyPair.secretKey,
    };
  }

  /**
   * Firma una credenziale con BBS+
   * @param {Array<Uint8Array>} messages - Messaggi da firmare
   * @param {Uint8Array} secretKey - Chiave privata
   * @returns {Promise<Uint8Array>} Signature
   */
  async signCredential(messages, secretKey) {
    return await blsSign({
      keyPair: { secretKey },
      messages,
    });
  }

  /**
   * Verifica firma BBS+
   * @param {Uint8Array} signature - Firma
   * @param {Array<Uint8Array>} messages - Messaggi originali
   * @param {Uint8Array} publicKey - Chiave pubblica
   * @returns {Promise<boolean>} True se valida
   */
  async verifySignature(signature, messages, publicKey) {
    const result = await blsVerify({
      publicKey,
      signature,
      messages,
    });
    return result.verified;
  }

  /**
   * Crea proof derivato con selective disclosure
   * @param {Uint8Array} signature - Firma originale
   * @param {Uint8Array} publicKey - Chiave pubblica issuer
   * @param {Array<Uint8Array>} messages - Tutti i messaggi
   * @param {Array<number>} revealedIndices - Indici messaggi da rivelare
   * @param {Uint8Array} nonce - Nonce per proof
   * @returns {Promise<Uint8Array>} Derived proof
   */
  async createDerivedProof(signature, publicKey, messages, revealedIndices, nonce) {
    return await blsCreateProof({
      signature,
      publicKey,
      messages,
      nonce,
      revealed: revealedIndices,
    });
  }

  /**
   * Verifica proof derivato
   * @param {Uint8Array} proof - Proof derivato
   * @param {Uint8Array} publicKey - Chiave pubblica issuer
   * @param {Array<Uint8Array>} revealedMessages - Messaggi rivelati
   * @param {Uint8Array} nonce - Nonce usato
   * @returns {Promise<boolean>} True se valido
   */
  async verifyDerivedProof(proof, publicKey, revealedMessages, nonce) {
    const result = await blsVerifyProof({
      proof,
      publicKey,
      messages: revealedMessages,
      nonce,
    });
    return result.verified;
  }

  /**
   * Converti credenziale in messaggi BBS+
   * @param {Object} credential - VC
   * @returns {Array<Uint8Array>} Messaggi
   */
  credentialToMessages(credential) {
    const messages = [];
    const subject = credential.credentialSubject;

    // Converti ogni campo in messaggio
    for (const [key, value] of Object.entries(subject)) {
      if (key !== "id") {
        const message = new TextEncoder().encode(JSON.stringify({ [key]: value }));
        messages.push(message);
      }
    }

    return messages;
  }

  /**
   * Ricostruisci credenziale da messaggi rivelati
   * @param {Array<Object>} revealedMessages - Messaggi in chiaro
   * @returns {Object} Partial credential
   */
  messagesToCredential(revealedMessages) {
    const credentialSubject = {};

    for (const msg of revealedMessages) {
      const decoded = new TextDecoder().decode(msg);
      const parsed = JSON.parse(decoded);
      Object.assign(credentialSubject, parsed);
    }

    return { credentialSubject };
  }
}

export const bbsManager = new BBSManager();
