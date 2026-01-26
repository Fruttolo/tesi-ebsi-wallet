const EBSI_BASE_URL = "https://api-pilot.ebsi.eu";

export class EBSIClient {
  constructor(bearerToken = null) {
    this.bearerToken = bearerToken;
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
    };
  }

  /**
   * Esegue richiesta HTTP con retry logic
   * @private
   */
  async _request(endpoint, options = {}, retryCount = 0) {
    const url = `${EBSI_BASE_URL}${endpoint}`;

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.bearerToken) {
      headers["Authorization"] = `Bearer ${this.bearerToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Rate limiting - attendi e riprova
      if (response.status === 429 && retryCount < this.retryConfig.maxRetries) {
        const retryAfter = parseInt(response.headers.get("Retry-After") || "1");
        await this._sleep(retryAfter * 1000);
        return this._request(endpoint, options, retryCount + 1);
      }

      // Altri errori temporanei
      if ([502, 503, 504].includes(response.status) && retryCount < this.retryConfig.maxRetries) {
        const delay =
          this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount);
        await this._sleep(delay);
        return this._request(endpoint, options, retryCount + 1);
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new EBSIError(error.message || `HTTP ${response.status}`, response.status, error);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof EBSIError) throw error;

      // Network errors - retry
      if (retryCount < this.retryConfig.maxRetries) {
        const delay =
          this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount);
        await this._sleep(delay);
        return this._request(endpoint, options, retryCount + 1);
      }

      throw new EBSIError("Network error", 0, error);
    }
  }

  /**
   * Helper sleep
   * @private
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============ DID Registry API ============

  /**
   * Risolve un DID dal registro
   * @param {string} did - DID da risolvere
   * @returns {Promise<Object>} DID Document
   */
  async resolveDID(did) {
    return this._request(`/did-registry/v3/identifiers/${encodeURIComponent(did)}`);
  }

  /**
   * Registra un nuovo DID
   * @param {Object} didDocument - DID Document da registrare
   * @returns {Promise<Object>} Risultato registrazione
   */
  async registerDID(didDocument) {
    return this._request("/did-registry/v3/identifiers", {
      method: "POST",
      body: JSON.stringify(didDocument),
    });
  }

  // ============ Trusted Issuers Registry API ============

  /**
   * Ottiene lista issuer trusted
   * @param {Object} params - Query parameters (limit, offset, etc)
   * @returns {Promise<Object>} Lista issuer
   */
  async getTrustedIssuers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/trusted-issuers-registry/v3/issuers${queryString ? "?" + queryString : ""}`;
    return this._request(endpoint);
  }

  /**
   * Verifica se un issuer è trusted
   * @param {string} issuerDID - DID dell'issuer
   * @returns {Promise<boolean>} True se trusted
   */
  async isIssuerTrusted(issuerDID) {
    try {
      const issuer = await this._request(
        `/trusted-issuers-registry/v3/issuers/${encodeURIComponent(issuerDID)}`
      );
      return issuer && issuer.active === true;
    } catch (error) {
      if (error.statusCode === 404) return false;
      throw error;
    }
  }

  /**
   * Ottiene dettagli issuer
   * @param {string} issuerDID - DID dell'issuer
   * @returns {Promise<Object>} Dettagli issuer
   */
  async getIssuerDetails(issuerDID) {
    return this._request(`/trusted-issuers-registry/v3/issuers/${encodeURIComponent(issuerDID)}`);
  }

  // ============ Timestamp API ============

  /**
   * Crea timestamp per un documento
   * @param {string} hash - Hash del documento
   * @returns {Promise<Object>} Timestamp record
   */
  async createTimestamp(hash) {
    return this._request("/timestamp/v3/timestamps", {
      method: "POST",
      body: JSON.stringify({ hash }),
    });
  }

  /**
   * Verifica timestamp
   * @param {string} timestampId - ID del timestamp
   * @returns {Promise<Object>} Timestamp record
   */
  async verifyTimestamp(timestampId) {
    return this._request(`/timestamp/v3/timestamps/${timestampId}`);
  }

  // ============ Health Check ============

  /**
   * Verifica stato API EBSI
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    return this._request("/health");
  }
}

/**
 * Custom error class per EBSI API
 */
export class EBSIError extends Error {
  constructor(message, statusCode, details) {
    super(message);
    this.name = "EBSIError";
    this.statusCode = statusCode;
    this.details = details;
  }
}
