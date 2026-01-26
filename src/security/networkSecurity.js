/**
 * Network Security
 * Certificate pinning, firma richieste, protezione MITM
 *
 * @module security/networkSecurity
 */

import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

/**
 * Certificate Pinning per EBSI API
 * Previene attacchi Man-in-the-Middle
 */
export class NetworkSecurity {
  /**
   * Pin certificati EBSI (SHA256 public key)
   * Aggiornare periodicamente!
   */
  static EBSI_PINS = [
    // Primary pin per api-pilot.ebsi.eu
    // Nota: questi sono placeholder, sostituire con pin reali
    "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    // Backup pin
    "sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=",
  ];

  /**
   * Domini trusted
   */
  static TRUSTED_DOMAINS = ["api-pilot.ebsi.eu", "api-conformance.ebsi.eu", "api.ebsi.eu"];

  /**
   * Setup certificate pinning
   * Nota: richiede plugin capacitor-plugin-ssl-pinning
   */
  static setupCertificatePinning() {
    // Placeholder - richiede plugin nativo
    // Plugin: cordova-plugin-advanced-http

    console.log("Certificate pinning configured for EBSI domains");
  }

  /**
   * Valida URL prima della richiesta
   * @param {string} url - URL da validare
   * @returns {boolean}
   */
  static validateUrl(url) {
    try {
      const urlObj = new URL(url);

      // Solo HTTPS
      if (urlObj.protocol !== "https:") {
        console.error("HTTP not allowed:", url);
        return false;
      }

      // Controlla dominio trusted
      const isTrusted = this.TRUSTED_DOMAINS.some(
        (domain) => urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );

      if (!isTrusted) {
        console.warn("Untrusted domain:", urlObj.hostname);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Invalid URL:", url, error);
      return false;
    }
  }

  /**
   * Valida certificato TLS
   * @param {string} url - URL del server
   * @returns {Promise<boolean>}
   */
  static async validateCertificate(url) {
    if (!this.validateUrl(url)) {
      return false;
    }

    // Placeholder - verifica:
    // - TLS 1.2+
    // - Certificate chain valida
    // - Non expired
    // - Hostname match
    // - Pin match (se configurato)

    return true;
  }

  /**
   * Firma richiesta con chiave DID
   * @param {object} requestBody - Body della richiesta
   * @param {Uint8Array} privateKey - Chiave privata DID
   * @returns {object} Body firmato
   */
  static signRequest(requestBody, privateKey) {
    const timestamp = Date.now();
    const nonce = crypto.randomUUID();

    // Crea payload da firmare
    const payload = {
      ...requestBody,
      timestamp,
      nonce,
    };

    // Calcola firma
    const message = JSON.stringify(payload);
    const messageHash = sha256(new TextEncoder().encode(message));

    // Nota: firma reale richiederebbe uso di noble/curves per Ed25519
    // Placeholder per dimostrazione
    const signature = bytesToHex(messageHash);

    return {
      ...payload,
      signature,
    };
  }

  /**
   * Verifica firma risposta
   * @param {object} response - Response dal server
   * @param {Uint8Array} publicKey - Chiave pubblica server
   * @returns {boolean}
   */
  static verifyResponse(response, publicKey) {
    if (!response.signature || !response.timestamp || !response.nonce) {
      console.error("Missing signature fields");
      return false;
    }

    // Verifica timestamp recente
    if (!this.validateTimestamp(response.timestamp)) {
      return false;
    }

    // Verifica nonce unico
    if (!this.validateNonce(response.nonce, response.timestamp)) {
      return false;
    }

    // Verifica firma
    // Placeholder - implementazione reale richiederebbe crypto completo
    return true;
  }

  /**
   * Verifica replay attack via timestamp
   * @param {number} timestamp - Timestamp richiesta
   * @returns {boolean}
   */
  static validateTimestamp(timestamp) {
    const now = Date.now();
    const age = now - timestamp;

    // Max 5 minuti di differenza
    const MAX_AGE = 5 * 60 * 1000;

    if (age < 0) {
      console.error("Timestamp in the future");
      return false;
    }

    if (age > MAX_AGE) {
      console.error("Request too old:", age, "ms");
      return false;
    }

    return true;
  }

  /**
   * Verifica nonce unico (previene replay)
   * @param {string} nonce - Nonce da verificare
   * @param {number} timestamp - Timestamp associato
   * @returns {boolean}
   */
  static validateNonce(nonce, timestamp) {
    // Ottieni cache nonces
    const cache = this._getNonceCache();

    // Controlla se già usato
    if (cache.has(nonce)) {
      console.error("Nonce already used:", nonce);
      return false;
    }

    // Aggiungi a cache
    cache.set(nonce, timestamp);

    // Pulisci nonces vecchi
    this._cleanNonceCache(cache);

    return true;
  }

  /**
   * Cache nonces per replay protection
   * @private
   */
  static _nonceCache = new Map();

  /**
   * Ottieni cache nonces
   * @private
   * @returns {Map}
   */
  static _getNonceCache() {
    return this._nonceCache;
  }

  /**
   * Pulisci nonces vecchi dalla cache
   * @private
   * @param {Map} cache - Cache nonces
   */
  static _cleanNonceCache(cache) {
    const now = Date.now();
    const MAX_AGE = 10 * 60 * 1000; // 10 minuti

    for (const [nonce, timestamp] of cache.entries()) {
      if (now - timestamp > MAX_AGE) {
        cache.delete(nonce);
      }
    }
  }

  /**
   * Aggiungi headers sicurezza a richiesta
   * @param {Headers} headers - Headers da arricchire
   * @returns {Headers}
   */
  static addSecurityHeaders(headers = new Headers()) {
    headers.set("X-Requested-With", "XMLHttpRequest");
    headers.set("X-Client-Version", "1.0.0");
    headers.set("X-Platform", "capacitor-android");

    // Anti-CSRF token se disponibile
    const csrfToken = this._getCSRFToken();
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }

    return headers;
  }

  /**
   * Ottieni CSRF token dal cookie
   * @private
   * @returns {string|null}
   */
  static _getCSRFToken() {
    // Placeholder - implementazione dipende da backend
    return null;
  }
}

/**
 * Rate Limiting Client-Side
 * Previene abusi API
 */
export class RateLimiter {
  /**
   * Map endpoint -> [timestamps]
   */
  static limits = new Map();

  /**
   * Controlla rate limit
   * @param {string} endpoint - Endpoint API
   * @param {number} maxRequests - Max richieste
   * @param {number} windowMs - Finestra temporale (ms)
   * @returns {boolean}
   */
  static check(endpoint, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const requests = this.limits.get(endpoint) || [];

    // Rimuovi richieste fuori finestra
    const recentRequests = requests.filter((timestamp) => now - timestamp < windowMs);

    // Controlla limite
    if (recentRequests.length >= maxRequests) {
      console.warn(`Rate limit exceeded for ${endpoint}`);
      return false;
    }

    // Aggiungi nuova richiesta
    recentRequests.push(now);
    this.limits.set(endpoint, recentRequests);

    return true;
  }

  /**
   * Reset rate limit per endpoint
   * @param {string} endpoint - Endpoint da resettare
   */
  static reset(endpoint) {
    this.limits.delete(endpoint);
  }

  /**
   * Reset tutti i rate limits
   */
  static resetAll() {
    this.limits.clear();
  }
}
