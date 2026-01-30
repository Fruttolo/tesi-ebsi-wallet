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
