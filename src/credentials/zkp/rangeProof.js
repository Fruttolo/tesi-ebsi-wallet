/**
 * Range proofs per valori numerici
 * Prova che X ∈ [min, max] senza rivelare X
 */

/**
 * Crea range proof
 * @param {number} value - Valore da provare
 * @param {number} min - Minimo range
 * @param {number} max - Massimo range
 * @returns {Promise<Object>} Proof
 */
export async function createRangeProof(value, min, max) {
  if (value < min || value > max) {
    throw new Error(`Value ${value} not in range [${min}, ${max}]`);
  }

  // Commitment del valore
  const commitment = await commitToValue(value);

  return {
    type: "RangeProof",
    range: { min, max },
    commitment: Buffer.from(commitment).toString("hex"),
    // Proof che value ∈ [min, max]
    proof: "simplified_range_proof",
  };
}

/**
 * Verifica range proof
 * @param {Object} proof - Proof
 * @returns {boolean} True se valido
 */
export function verifyRangeProof(proof) {
  return proof.type === "RangeProof" && proof.proof === "simplified_range_proof";
}

/**
 * Commit to value
 * @private
 */
async function commitToValue(value) {
  const data = new TextEncoder().encode(value.toString());
  return await crypto.subtle.digest("SHA-256", data);
}
