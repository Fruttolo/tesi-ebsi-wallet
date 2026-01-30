import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";

const DID_KEY = "wallet_did";
const DID_DOC_KEY = "wallet_did_document";
const PRIVATE_KEY_KEY = "wallet_private_key";
const PUBLIC_KEY_KEY = "wallet_public_key";

/**
 * Salva DID localmente usando Capacitor Preferences
 * @param {string} did - DID da salvare
 */
export async function saveDID(did) {
  if (!did) {
    throw new Error("DID is required");
  }
  await SecureStoragePlugin.set({ key: DID_KEY, value: did });
}

/**
 * Recupera DID salvato
 * @returns {Promise<string|null>} DID o null
 */
export async function getDID() {
  const result = await SecureStoragePlugin.get({ key: DID_KEY });
  return result.value;
}

/**
 * Salva DID Document
 * @param {Object} didDocument - DID Document
 */
export async function saveDIDDocument(didDocument) {
  if (!didDocument) {
    throw new Error("DID Document is required");
  }
  await SecureStoragePlugin.set({
    key: DID_DOC_KEY,
    value: JSON.stringify(didDocument),
  });
}

/**
 * Recupera DID Document
 * @returns {Promise<Object|null>} DID Document o null
 */
export async function getDIDDocument() {
  const result = await SecureStoragePlugin.get({ key: DID_DOC_KEY });
  return result.value ? JSON.parse(result.value) : null;
}

/**
 * Salva chiavi JWK (usa Preferences per compatibilità, ma considera SecureStorage)
 * @param {Object} privateJwk - Chiave privata JWK
 * @param {Object} publicJwk - Chiave pubblica JWK
 */
export async function saveKeys(privateJwk, publicJwk) {
  if (!privateJwk || !publicJwk) {
    throw new Error("Both private and public keys are required");
  }

  await SecureStoragePlugin.set({
    key: PRIVATE_KEY_KEY,
    value: JSON.stringify(privateJwk),
  });

  await SecureStoragePlugin.set({
    key: PUBLIC_KEY_KEY,
    value: JSON.stringify(publicJwk),
  });
}

/**
 * Recupera chiave privata JWK
 * @returns {Promise<Object|null>} Chiave privata o null
 */
export async function getPrivateKey() {
  const result = await SecureStoragePlugin.get({ key: PRIVATE_KEY_KEY });
  return result.value ? JSON.parse(result.value) : null;
}

/**
 * Recupera chiave pubblica JWK
 * @returns {Promise<Object|null>} Chiave pubblica o null
 */
export async function getPublicKey() {
  const result = await SecureStoragePlugin.get({ key: PUBLIC_KEY_KEY });
  return result.value ? JSON.parse(result.value) : null;
}

/**
 * Verifica se il wallet è già inizializzato
 * @returns {Promise<boolean>} True se esiste un DID salvato
 */
export async function isWalletInitialized() {
  const did = await getDID();
  return did !== null && did !== "";
}

/**
 * Cancella tutti i dati DID
 */
export async function clearDIDData() {
  await SecureStoragePlugin.remove({ key: DID_KEY });
  await SecureStoragePlugin.remove({ key: DID_DOC_KEY });
  await SecureStoragePlugin.remove({ key: PRIVATE_KEY_KEY });
  await SecureStoragePlugin.remove({ key: PUBLIC_KEY_KEY });
}

/**
 * Importa dati del wallet da backup
 * @param {Object} walletData - Dati da importare
 */
export async function importWalletData(walletData) {
  if (!walletData || !walletData.did) {
    throw new Error("Invalid wallet data");
  }

  if (walletData.did) await saveDID(walletData.did);
  if (walletData.didDocument) await saveDIDDocument(walletData.didDocument);
  if (walletData.privateKey && walletData.publicKey) {
    await saveKeys(walletData.privateKey, walletData.publicKey);
  }
}
