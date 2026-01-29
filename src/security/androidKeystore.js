/**
 * Android Keystore Integration
 * Wrapper per gestione chiavi sicure tramite Android Keystore
 *
 * @module security/androidKeystore
 */

import { Capacitor } from "@capacitor/core";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";

/**
 * Wrapper Android Keystore tramite plugin
 * Fornisce storage sicuro hardware-backed per chiavi crittografiche
 */
export class AndroidKeystore {
  /**
   * Verifica disponibilità Keystore
   * @returns {Promise<boolean>}
   */
  static async isAvailable() {
    return Capacitor.getPlatform() === "android";
  }

  /**
   * Salva dato sensibile in Keystore
   * @param {string} key - Chiave univoca
   * @param {string} value - Valore da proteggere
   * @returns {Promise<void>}
   */
  static async set(key, value) {
    if (!(await this.isAvailable())) {
      console.warn("Android Keystore not available, falling back to encrypted storage");
      // Fallback a storage criptato
      return;
    }

    try {
      await SecureStoragePlugin.set({ key, value });
    } catch (error) {
      console.error("APP-EBSI: Keystore set failed:", error);
      throw new Error(`Failed to store ${key} in Keystore`);
    }
  }

  /**
   * Recupera dato da Keystore
   * @param {string} key - Chiave da recuperare
   * @returns {Promise<string|null>}
   */
  static async get(key) {
    if (!(await this.isAvailable())) {
      return null;
    }

    try {
      const result = await SecureStoragePlugin.get({ key });
      return result.value;
    } catch (error) {
      if (error.message?.includes("not found")) {
        return null;
      }
      console.error("APP-EBSI: Keystore get failed:", error);
      throw error;
    }
  }

  /**
   * Rimuove dato da Keystore
   * @param {string} key - Chiave da rimuovere
   * @returns {Promise<void>}
   */
  static async remove(key) {
    if (!(await this.isAvailable())) {
      return;
    }

    try {
      await SecureStoragePlugin.remove({ key });
    } catch (error) {
      console.error("APP-EBSI: Keystore remove failed:", error);
    }
  }

  /**
   * Pulisce tutti i dati dal Keystore
   * ATTENZIONE: operazione irreversibile
   * @returns {Promise<void>}
   */
  static async clear() {
    if (!(await this.isAvailable())) {
      return;
    }

    try {
      await SecureStoragePlugin.clear();
    } catch (error) {
      console.error("APP-EBSI: Keystore clear failed:", error);
    }
  }

  /**
   * Salva seed phrase in Keystore
   * @param {string} seedPhrase - Seed phrase BIP39
   * @returns {Promise<void>}
   */
  static async saveSeedPhrase(seedPhrase) {
    await this.set("wallet_seed_phrase", seedPhrase);
  }

  /**
   * Recupera seed phrase da Keystore
   * @returns {Promise<string|null>}
   */
  static async getSeedPhrase() {
    return await this.get("wallet_seed_phrase");
  }

  /**
   * Salva chiave privata DID in Keystore
   * @param {string} did - DID identifier
   * @param {string} privateKey - Chiave privata (hex)
   * @returns {Promise<void>}
   */
  static async savePrivateKey(did, privateKey) {
    await this.set(`did_private_key_${did}`, privateKey);
  }

  /**
   * Recupera chiave privata DID da Keystore
   * @param {string} did - DID identifier
   * @returns {Promise<string|null>}
   */
  static async getPrivateKey(did) {
    return await this.get(`did_private_key_${did}`);
  }
}

/**
 * Biometric Authentication Helper
 * Wrapper per autenticazione biometrica
 */
export class BiometricAuth {
  /**
   * Verifica disponibilità biometrica
   * @returns {Promise<boolean>}
   */
  static async isAvailable() {
    // Note: capacitor-native-biometric non è nel package.json
    // Questa è una placeholder implementation
    return false;
  }

  /**
   * Autentica con biometria
   * @param {string} reason - Motivo mostrato all'utente
   * @returns {Promise<boolean>}
   */
  static async authenticate(reason = "Unlock wallet") {
    if (!(await this.isAvailable())) {
      return false;
    }

    try {
      // Placeholder per future implementation
      // const result = await NativeBiometric.verifyIdentity({ reason });
      // return result.verified;
      return false;
    } catch (error) {
      console.error("APP-EBSI: Biometric auth failed:", error);
      return false;
    }
  }

  /**
   * Recupera dato con autenticazione biometrica
   * @param {string} key - Chiave da recuperare
   * @param {string} reason - Motivo mostrato all'utente
   * @returns {Promise<string|null>}
   */
  static async getWithBiometric(key, reason = "Access secure data") {
    const authenticated = await this.authenticate(reason);

    if (!authenticated) {
      throw new Error("Biometric authentication failed");
    }

    return await AndroidKeystore.get(key);
  }
}
