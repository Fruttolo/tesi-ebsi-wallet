import { pbkdf2 } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { randomBytes } from "@noble/hashes/utils.js";

/**
 * Cripta dati con AES-GCM
 * @param {string} plaintext - Testo da cifrare
 * @param {string} password - Password
 * @returns {Promise<string>} Testo cifrato (base64)
 */
export async function encrypt(plaintext, password) {
  if (!plaintext || !password) {
    throw new Error("Plaintext and password are required");
  }

  // Genera salt e IV casuali
  const salt = randomBytes(16);
  const iv = randomBytes(12);

  // Deriva chiave da password con PBKDF2
  const key = pbkdf2(sha256, password, salt, {
    c: 100000, // iterations
    dkLen: 32, // 256 bits
  });

  // Import key per Web Crypto API
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "AES-GCM" }, false, [
    "encrypt",
  ]);

  // Cifra
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, encoded);

  // Combina salt + iv + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  // Encode in base64
  if (typeof Buffer !== "undefined") {
    return Buffer.from(combined).toString("base64");
  }

  // Browser fallback
  let binary = "";
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

/**
 * Decripta dati
 * @param {string} ciphertext - Testo cifrato (base64)
 * @param {string} password - Password
 * @returns {Promise<string>} Testo in chiaro
 */
export async function decrypt(ciphertext, password) {
  if (!ciphertext || !password) {
    throw new Error("Ciphertext and password are required");
  }

  // Decode base64
  let combined;
  if (typeof Buffer !== "undefined") {
    combined = Buffer.from(ciphertext, "base64");
  } else {
    // Browser fallback
    const binary = atob(ciphertext);
    combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }
  }

  // Estrai salt, iv, ciphertext
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encrypted = combined.slice(28);

  // Deriva chiave
  const key = pbkdf2(sha256, password, salt, {
    c: 100000,
    dkLen: 32,
  });

  // Import key
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "AES-GCM" }, false, [
    "decrypt",
  ]);

  try {
    // Decifra
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, encrypted);

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    throw new Error("Decryption failed: wrong password or corrupted data");
  }
}

/**
 * Testa se una password è corretta provando a decifrare
 * @param {string} encryptedData - Dati cifrati
 * @param {string} password - Password da testare
 * @returns {Promise<boolean>} True se la password è corretta
 */
export async function verifyPassword(encryptedData, password) {
  try {
    await decrypt(encryptedData, password);
    return true;
  } catch {
    return false;
  }
}
