import { Preferences } from "@capacitor/preferences";
import { v4 as uuidv4 } from "uuid";

const CREDENTIALS_KEY = "wallet_credentials";

/**
 * Salva credenziale
 * @param {Object} credential - VC da salvare
 * @returns {Promise<string>} ID credenziale
 */
export async function saveCredential(credential) {
  const credentials = await getAllCredentials();

  // Genera ID se non presente
  const id = credential.id || uuidv4();
  const credentialWithId = { ...credential, id };

  // Aggiungi metadata
  credentialWithId._metadata = {
    savedAt: new Date().toISOString(),
    lastAccessed: new Date().toISOString(),
  };

  credentials.push(credentialWithId);

  await Preferences.set({
    key: CREDENTIALS_KEY,
    value: JSON.stringify(credentials),
  });

  return id;
}

/**
 * Ottieni tutte le credenziali
 * @returns {Promise<Array>} Lista credenziali
 */
export async function getAllCredentials() {
  const result = await Preferences.get({ key: CREDENTIALS_KEY });
  return result.value ? JSON.parse(result.value) : [];
}

/**
 * Ottieni credenziale per ID
 * @param {string} id - ID credenziale
 * @returns {Promise<Object|null>} Credenziale
 */
export async function getCredentialById(id) {
  const credentials = await getAllCredentials();
  const cred = credentials.find((c) => c.id === id);

  if (cred) {
    // Update last accessed
    cred._metadata.lastAccessed = new Date().toISOString();
    await updateCredential(id, cred);
  }

  return cred || null;
}

/**
 * Aggiorna credenziale
 * @param {string} id - ID credenziale
 * @param {Object} updatedCredential - Credenziale aggiornata
 */
export async function updateCredential(id, updatedCredential) {
  const credentials = await getAllCredentials();
  const index = credentials.findIndex((c) => c.id === id);

  if (index !== -1) {
    credentials[index] = updatedCredential;
    await Preferences.set({
      key: CREDENTIALS_KEY,
      value: JSON.stringify(credentials),
    });
  }
}

/**
 * Elimina credenziale
 * @param {string} id - ID credenziale
 */
export async function deleteCredential(id) {
  const credentials = await getAllCredentials();
  const filtered = credentials.filter((c) => c.id !== id);

  await Preferences.set({
    key: CREDENTIALS_KEY,
    value: JSON.stringify(filtered),
  });
}

/**
 * Elimina tutte le credenziali
 */
export async function clearAllCredentials() {
  await Preferences.remove({ key: CREDENTIALS_KEY });
}

/**
 * Alias per getAllCredentials - compatibilità con naming diverso
 */
export const getStoredCredentials = getAllCredentials;
