#!/usr/bin/env node
/**
 * Script per debuggare la generazione del JWT Proof
 * e verificare la firma
 */

import { generateMnemonic, mnemonicToSeed } from "../src/crypto/seedManager.js";
import { derivePrivateKey, createJWK } from "../src/crypto/keyDerivation.js";
import { generateDID, createDIDDocument, getKeyIdFromDID } from "../src/identity/didManager.js";
import { p256 } from "@noble/curves/nist.js";
import { sha256 } from "@noble/hashes/sha2.js";

/**
 * Base64URL decode
 */
function base64urlToBytes(str) {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = Buffer.from(padded, "base64");
  return new Uint8Array(binary);
}

/**
 * Decodifica un JWT
 */
function decodeJWT(jwt) {
  const parts = jwt.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  const header = JSON.parse(
    Buffer.from(encodedHeader.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()
  );
  const payload = JSON.parse(
    Buffer.from(encodedPayload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()
  );

  return {
    header,
    payload,
    signature: encodedSignature,
    signingInput: `${encodedHeader}.${encodedPayload}`,
  };
}

/**
 * Verifica manualmente la firma di un JWT
 */
function verifyJWTManually(jwt, publicKeyJwk) {
  const { header, payload, signature, signingInput } = decodeJWT(jwt);

  console.log("APP-EBSI: \n=== JWT Decoded ===");
  console.log("APP-EBSI: Header:", JSON.stringify(header, null, 2));
  console.log("APP-EBSI: Payload:", JSON.stringify(payload, null, 2));

  // Verifica algoritmo
  if (header.alg !== "ES256") {
    throw new Error(`Unsupported algorithm: ${header.alg}`);
  }

  // Converti signing input in bytes
  const messageBytes = new TextEncoder().encode(signingInput);
  const messageHash = sha256(messageBytes);

  console.log("APP-EBSI: \n=== Signature Verification ===");
  console.log("APP-EBSI: Message hash (hex):", Buffer.from(messageHash).toString("hex"));

  // Decode signature
  const signatureBytes = base64urlToBytes(signature);
  console.log("APP-EBSI: Signature length:", signatureBytes.length);

  // Ricostruisci chiave pubblica da JWK
  const x = base64urlToBytes(publicKeyJwk.x);
  const y = base64urlToBytes(publicKeyJwk.y);

  console.log("APP-EBSI: Public key X length:", x.length);
  console.log("APP-EBSI: Public key Y length:", y.length);

  // Crea chiave pubblica uncompressed (0x04 + x + y)
  const publicKeyBytes = new Uint8Array(1 + x.length + y.length);
  publicKeyBytes[0] = 0x04;
  publicKeyBytes.set(x, 1);
  publicKeyBytes.set(y, 1 + x.length);

  console.log("APP-EBSI: Public key bytes length:", publicKeyBytes.length);
  console.log("APP-EBSI: Public key (hex):", Buffer.from(publicKeyBytes).toString("hex"));

  // Verifica firma con P-256
  const isValid = p256.verify(signatureBytes, messageHash, publicKeyBytes);

  console.log("APP-EBSI: \n=== Verification Result ===");
  console.log("APP-EBSI: Signature valid:", isValid);

  return isValid;
}

/**
 * Base64URL encoding
 */
function base64urlEncode(obj) {
  const json = JSON.stringify(obj);
  const base64 = Buffer.from(json).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Bytes to base64url
 */
function bytesToBase64url(bytes) {
  const base64 = Buffer.from(bytes).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Create Proof JWT manually (without storage dependency)
 */
async function createProofJWTManual(issuerDid, audience, nonce, privateJwk) {
  const keyId = getKeyIdFromDID(issuerDid);

  const header = {
    alg: "ES256",
    typ: "openid4vci-proof+jwt",
    kid: keyId,
  };

  const payload = {
    iss: issuerDid,
    aud: audience,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 600,
    nonce: nonce,
  };

  // Encode header e payload
  const encodedHeader = base64urlEncode(header);
  const encodedPayload = base64urlEncode(payload);

  // Crea signing input
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  // Converti signing input in bytes
  const messageBytes = new TextEncoder().encode(signingInput);
  const messageHash = sha256(messageBytes);

  // Converti chiave privata JWK in bytes
  const privateKeyBytes = base64urlToBytes(privateJwk.d);

  // Firma con P-256 in formato raw (IEEE P1363 r+s per ES256)
  const signature = await p256.sign(messageHash, privateKeyBytes, { der: false });

  // Converti signature in base64url
  const signatureBase64url = bytesToBase64url(signature);

  // Costruisci JWT completo
  const jwt = `${signingInput}.${signatureBase64url}`;

  return jwt;
}

async function main() {
  console.log("APP-EBSI: === JWT Proof Debug Script ===\n");

  // 1. Genera wallet
  console.log("APP-EBSI: 1. Generating wallet...");
  const mnemonic = generateMnemonic(128);
  const seed = await mnemonicToSeed(mnemonic);
  const privateKey = derivePrivateKey(seed);
  const { privateJwk, publicJwk } = createJWK(privateKey);

  console.log(
    "APP-EBSI: Private JWK:",
    JSON.stringify({ ...privateJwk, d: "[REDACTED]" }, null, 2)
  );
  console.log("APP-EBSI: Public JWK:", JSON.stringify(publicJwk, null, 2));

  // 2. Genera DID
  console.log("APP-EBSI: \n2. Generating DID...");
  const did = generateDID(publicJwk);
  console.log("APP-EBSI: DID:", did);

  const didDocument = createDIDDocument(did, publicJwk);
  console.log("APP-EBSI: DID Document:");
  console.log(JSON.stringify(didDocument, null, 2));

  // 3. Ottieni key ID
  console.log("APP-EBSI: \n3. Getting Key ID...");
  const keyId = getKeyIdFromDID(did);
  console.log("APP-EBSI: Key ID (kid):", keyId);

  // Verifica che il keyId corrisponda al verificationMethod
  const vmId = didDocument.verificationMethod[0].id;
  console.log("APP-EBSI: Verification Method ID:", vmId);
  console.log("APP-EBSI: Kid matches VM ID:", keyId === vmId);

  // 4. Crea JWT Proof
  console.log("APP-EBSI: \n4. Creating JWT Proof...");
  const audience = "https://api-conformance.ebsi.eu";
  const nonce = "test-nonce-12345";

  const proofJWT = await createProofJWTManual(did, audience, nonce, privateJwk);
  console.log("APP-EBSI: \nJWT Proof:");
  console.log(proofJWT);

  // 5. Verifica JWT
  console.log("APP-EBSI: \n5. Verifying JWT...");
  try {
    const isValid = verifyJWTManually(proofJWT, publicJwk);

    if (isValid) {
      console.log("APP-EBSI: \n✅ SUCCESS: JWT Proof is valid!");
    } else {
      console.log("APP-EBSI: \n❌ FAILURE: JWT Proof signature is invalid!");
    }
  } catch (error) {
    console.error("APP-EBSI: \n❌ ERROR during verification:", error.message);
    console.error(error.stack);
  }
}

main().catch((error) => {
  console.error("APP-EBSI: Fatal error:", error);
  process.exit(1);
});
