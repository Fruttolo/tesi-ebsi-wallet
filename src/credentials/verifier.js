import { EBSIClient } from "../api/ebsiClient.js";
import { resolveDID } from "../identity/didResolver.js";

/**
 * Verifica JWT signature
 * @param {string} jwt - JWT to verify
 * @param {Object} issuerDocument - DID document dell'issuer
 * @returns {Promise<boolean>} True se firma valida
 */
async function verifyJWTSignature(jwt, issuerDocument) {
  // TODO: Implement actual JWT verification with public key from DID document
  // For now, return true as placeholder
  return true;
}

/**
 * Verifica Verifiable Credential
 * @param {Object} credential - VC da verificare
 * @param {Object} options - Opzioni verifica
 * @returns {Promise<Object>} Risultato verifica
 */
export async function verifyCredential(credential, options = {}) {
  const errors = [];
  const warnings = [];

  try {
    // 1. Verifica struttura
    if (!credential.proof) {
      errors.push("Missing proof");
      return { valid: false, errors, warnings };
    }

    // 2. Resolve issuer DID
    const issuerDID =
      typeof credential.issuer === "string" ? credential.issuer : credential.issuer.id;

    let issuerDocument;
    try {
      issuerDocument = await resolveDID(issuerDID);
    } catch (error) {
      errors.push(`Cannot resolve issuer DID: ${error.message}`);
      return { valid: false, errors, warnings };
    }

    // 3. Verifica issuer è trusted (EBSI registry)
    if (options.checkTrustedIssuer !== false) {
      const ebsi = new EBSIClient();
      try {
        const isTrusted = await ebsi.isIssuerTrusted(issuerDID);

        if (!isTrusted) {
          warnings.push("Issuer is not in EBSI trusted registry");
        }
      } catch (error) {
        warnings.push(`Could not verify trusted issuer: ${error.message}`);
      }
    }

    // 4. Verifica firma
    const proof = credential.proof;
    let signatureValid = false;

    if (proof.type === "JsonWebSignature2020" || proof.jws) {
      // Verifica JWS
      signatureValid = await verifyJWS(credential, proof, issuerDocument);
    } else if (proof.jwt) {
      // Verifica JWT
      signatureValid = await verifyJWTSignature(proof.jwt, issuerDocument);
    } else {
      errors.push(`Unsupported proof type: ${proof.type}`);
      return { valid: false, errors, warnings };
    }

    if (!signatureValid) {
      errors.push("Invalid signature");
      return { valid: false, errors, warnings };
    }

    // 5. Verifica scadenza
    if (credential.expirationDate) {
      const expiry = new Date(credential.expirationDate);
      if (expiry < new Date()) {
        errors.push("Credential expired");
        return { valid: false, errors, warnings };
      }
    }

    // 6. Verifica revoca (TODO: implement revocation check)
    // const isRevoked = await checkRevocation(credential);
    // if (isRevoked) {
    //   errors.push('Credential has been revoked');
    //   return { valid: false, errors, warnings };
    // }

    return {
      valid: true,
      errors,
      warnings,
      issuer: issuerDID,
      subject: credential.credentialSubject.id,
    };
  } catch (error) {
    errors.push(`Verification error: ${error.message}`);
    return { valid: false, errors, warnings };
  }
}
