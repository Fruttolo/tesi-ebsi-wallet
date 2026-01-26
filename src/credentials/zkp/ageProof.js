/**
 * Crea proof zero-knowledge per età >= X
 * Senza rivelare data di nascita esatta
 *
 * Nota: Implementazione semplificata
 * In produzione usare librerie ZK dedicate (snarkjs, circom)
 */

/**
 * Crea proof che age >= minAge
 * @param {string} dateOfBirth - Data nascita (ISO)
 * @param {number} minAge - Età minima da provare
 * @param {Uint8Array} secret - Secret per commitment
 * @returns {Promise<Object>} Proof
 */
export async function createAgeProof(dateOfBirth, minAge, secret) {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  // Calcola età
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Verifica condizione
  const isValid = age >= minAge;

  if (!isValid) {
    throw new Error(`Age ${age} is less than required ${minAge}`);
  }

  // Crea commitment della data di nascita
  // commitment = Hash(dateOfBirth || secret)
  const commitment = await createCommitment(dateOfBirth, secret);

  // Crea proof (semplificato)
  // In produzione: usare circuit ZK reale
  const proof = {
    type: "AgeProofOverXYears",
    minAge: minAge,
    commitment: Buffer.from(commitment).toString("hex"),
    // Proof che age >= minAge senza rivelare age esatta
    // Nel mondo reale sarebbe un SNARK proof
    proofData: "simplified_proof_placeholder",
  };

  return proof;
}

/**
 * Verifica age proof
 * @param {Object} proof - Proof da verificare
 * @returns {boolean} True se valido
 */
export function verifyAgeProof(proof) {
  // Verifica struttura proof
  if (proof.type !== "AgeProofOverXYears") {
    return false;
  }

  // Verifica proof data
  // In produzione: verifica SNARK proof

  return proof.proofData === "simplified_proof_placeholder";
}

/**
 * Crea commitment
 * @private
 */
async function createCommitment(data, secret) {
  const combined = new TextEncoder().encode(data + secret.toString());
  return await crypto.subtle.digest("SHA-256", combined);
}
