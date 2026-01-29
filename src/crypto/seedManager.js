import {
  generateMnemonic as generateMnemonicScure,
  mnemonicToSeed as mnemonicToSeedScure,
  validateMnemonic as validateMnemonicScure,
} from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";

/**
 * Genera una nuova seed phrase BIP39
 * @param {number} strength - Forza in bit (128 = 12 parole, 256 = 24 parole)
 * @returns {string} Mnemonic phrase
 */
export function generateMnemonic(strength = 128) {
  return generateMnemonicScure(wordlist, strength);
}

/**
 * Valida una seed phrase
 * @param {string} mnemonic - Seed phrase da validare
 * @returns {boolean} True se valida
 */
export function validateMnemonic(mnemonic) {
  return validateMnemonicScure(mnemonic, wordlist);
}

/**
 * Converte mnemonic in seed
 * @param {string} mnemonic - Seed phrase
 * @param {string} password - Password opzionale (BIP39 passphrase)
 * @returns {Promise<Uint8Array>} Seed derivato
 */
export async function mnemonicToSeed(mnemonic, password = "") {
  return mnemonicToSeedScure(mnemonic, password);
}

/**
 * Pulisce array dalla memoria (security)
 * @param {Uint8Array} arr - Array da pulire
 */
export function secureWipe(arr) {
  if (arr && arr.fill) {
    arr.fill(0);
  }
}
