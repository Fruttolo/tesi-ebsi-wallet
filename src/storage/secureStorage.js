import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { encrypt, decrypt } from "./encryptionManager.js";

/**
 * Salva dato crittografato con password utente
 * @param {string} key - Chiave storage
 * @param {string} value - Valore da salvare
 * @param {string} password - Password per encryption
 */
export async function setSecure(key, value, password) {
  if (!key || !value) {
    throw new Error("Key and value are required");
  }

  if (password) {
    // Encryption aggiuntiva con password utente
    const encrypted = await encrypt(value, password);
    await SecureStoragePlugin.set({ key, value: encrypted });
  } else {
    // Solo SecureStoragePlugin (già sicuro su Android/iOS)
    await SecureStoragePlugin.set({ key, value });
  }
}

/**
 * Recupera dato crittografato
 * @param {string} key - Chiave storage
 * @param {string} password - Password per decryption (opzionale)
 * @returns {Promise<string|null>} Valore decifrato o null
 */
export async function getSecure(key, password) {
  if (!key) {
    throw new Error("Key is required");
  }

  try {
    const result = await SecureStoragePlugin.get({ key });

    if (!result || !result.value) {
      return null;
    }

    if (password) {
      // Decifra con password utente
      try {
        return await decrypt(result.value, password);
      } catch (error) {
        console.error("APP-EBSI: Decryption failed:", error.message);
        throw new Error("Wrong password or corrupted data");
      }
    }

    return result.value;
  } catch (error) {
    if (error.message === "Item with given key does not exist") {
      return null;
    }
    throw error;
  }
}

/**
 * Rimuove dato sicuro
 * @param {string} key - Chiave da rimuovere
 */
export async function removeSecure(key) {
  if (!key) {
    throw new Error("Key is required");
  }

  try {
    await SecureStoragePlugin.remove({ key });
  } catch (error) {
    // Ignora errori se la chiave non esiste
    if (!error.message.includes("does not exist")) {
      throw error;
    }
  }
}

/**
 * Pulisce tutti i dati dal secure storage
 * ATTENZIONE: operazione irreversibile!
 */
export async function clearAllSecure() {
  try {
    await SecureStoragePlugin.clear();
  } catch (error) {
    console.error("APP-EBSI: Error clearing secure storage:", error);
    throw error;
  }
}

/**
 * Verifica se una chiave esiste
 * @param {string} key - Chiave da verificare
 * @returns {Promise<boolean>} True se esiste
 */
export async function existsSecure(key) {
  try {
    const result = await SecureStoragePlugin.get({ key });
    return result && result.value !== null && result.value !== undefined;
  } catch {
    return false;
  }
}
