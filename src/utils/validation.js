import { validateMnemonic } from "../crypto/seedManager.js";

/**
 * Valida formato seed phrase
 * @param {string} phrase - Frase da validare
 * @returns {Object} Risultato validazione con dettagli
 */
export function validateSeedPhrase(phrase) {
  const errors = [];

  if (!phrase || typeof phrase !== "string") {
    return {
      valid: false,
      errors: ["Seed phrase is required"],
      wordCount: 0,
    };
  }

  const trimmed = phrase.trim().toLowerCase();
  const words = trimmed.split(/\s+/);

  if (words.length !== 12 && words.length !== 24) {
    errors.push("Seed phrase deve essere di 12 o 24 parole");
  }

  if (!/^[a-z\s]+$/.test(trimmed)) {
    errors.push("Seed phrase deve contenere solo lettere minuscole e spazi");
  }

  // Validazione BIP39
  if (!validateMnemonic(trimmed)) {
    errors.push("Seed phrase non valida secondo standard BIP39");
  }

  return {
    valid: errors.length === 0,
    errors,
    wordCount: words.length,
  };
}

/**
 * Valida formato DID
 * @param {string} did - DID da validare
 * @returns {Object} Risultato validazione
 */
export function validateDID(did) {
  const errors = [];

  if (!did || typeof did !== "string") {
    return {
      valid: false,
      errors: ["DID is required"],
    };
  }

  // Formato base DID
  if (!did.startsWith("did:")) {
    errors.push("DID deve iniziare con 'did:'");
  }

  // Verifica metodo (key, ebsi, etc.)
  const parts = did.split(":");
  if (parts.length < 3) {
    errors.push("DID deve avere formato did:method:identifier");
  }

  const method = parts[1];
  const validMethods = ["key", "ebsi", "web", "ethr"];
  if (method && !validMethods.includes(method)) {
    errors.push(`Metodo DID '${method}' non supportato. Metodi validi: ${validMethods.join(", ")}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    method,
  };
}

/**
 * Valida password strength
 * @param {string} password - Password da validare
 * @param {Object} requirements - Requisiti opzionali
 * @returns {Object} Risultato validazione con punteggio
 */
export function validatePassword(password, requirements = {}) {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecial = false,
  } = requirements;

  const errors = [];
  let score = 0;

  if (!password) {
    return {
      valid: false,
      errors: ["Password is required"],
      score: 0,
    };
  }

  if (password.length < minLength) {
    errors.push(`Password deve essere almeno ${minLength} caratteri`);
  } else {
    score += 20;
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password deve contenere almeno una lettera maiuscola");
  } else if (/[A-Z]/.test(password)) {
    score += 20;
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password deve contenere almeno una lettera minuscola");
  } else if (/[a-z]/.test(password)) {
    score += 20;
  }

  if (requireNumbers && !/[0-9]/.test(password)) {
    errors.push("Password deve contenere almeno un numero");
  } else if (/[0-9]/.test(password)) {
    score += 20;
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password deve contenere almeno un carattere speciale");
  } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 20;
  }

  // Bonus per lunghezza extra
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  return {
    valid: errors.length === 0,
    errors,
    score: Math.min(score, 100),
    strength: score < 40 ? "weak" : score < 70 ? "medium" : "strong",
  };
}

/**
 * Valida formato JWK
 * @param {Object} jwk - JWK da validare
 * @returns {Object} Risultato validazione
 */
export function validateJWK(jwk) {
  const errors = [];

  if (!jwk || typeof jwk !== "object") {
    return {
      valid: false,
      errors: ["JWK must be an object"],
    };
  }

  // Campi richiesti
  const requiredFields = ["kty", "crv", "x", "y"];
  for (const field of requiredFields) {
    if (!jwk[field]) {
      errors.push(`JWK missing required field: ${field}`);
    }
  }

  // Valida tipo chiave
  if (jwk.kty && jwk.kty !== "EC" && jwk.kty !== "OKP") {
    errors.push(`Unsupported key type: ${jwk.kty}`);
  }

  // Valida curva
  const validCurves = ["P-256", "P-384", "P-521", "secp256k1", "Ed25519"];
  if (jwk.crv && !validCurves.includes(jwk.crv)) {
    errors.push(`Unsupported curve: ${jwk.crv}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    hasPrivateKey: !!jwk.d,
  };
}

/**
 * Sanitizza errori rimuovendo dati sensibili
 * @param {Error} error - Errore da sanitizzare
 * @returns {Error} Errore sanitizzato
 */
export function sanitizeError(error) {
  if (!error || !error.message) {
    return new Error("An error occurred");
  }

  // Rimuove informazioni sensibili dagli errori
  const sanitized = error.message
    .replace(/did:key:[A-Za-z0-9_-]+/g, "did:key:[REDACTED]")
    .replace(/did:ebsi:[A-Za-z0-9_-]+/g, "did:ebsi:[REDACTED]")
    .replace(/"d"\s*:\s*"[^"]+"/g, '"d":"[REDACTED]"')
    .replace(/privateKey[^:]*:\s*[^,}]+/gi, "privateKey:[REDACTED]")
    .replace(/mnemonic[^:]*:\s*[^,}]+/gi, "mnemonic:[REDACTED]");

  return new Error(sanitized);
}
