#!/usr/bin/env node
/**
 * Script per testare JWT Proof con parametri reali dalla richiesta EBSI
 */

import { getDIDDocument } from "../src/storage/didStorage.js";
import { createProofJWT, decodeJWT } from "../src/crypto/jwtUtils.js";

async function main() {
  console.log("=== Test JWT Proof con parametri reali ===\n");

  // 1. Carica DID esistente
  const didDocument = await getDIDDocument();
  if (!didDocument || !didDocument.id) {
    console.error("❌ DID non trovato. Crea prima un'identità nel wallet.");
    process.exit(1);
  }

  console.log("DID del wallet:", didDocument.id);
  console.log("DID Document:");
  console.log(JSON.stringify(didDocument, null, 2));

  // 2. Parametri per la richiesta EBSI
  const issuerUrl = "https://api-conformance.ebsi.eu/conformance/v3/issuer-mock";
  const testNonce = "test-nonce-12345"; // Sostituisci con c_nonce reale dalla risposta token

  console.log("\n=== Parametri JWT Proof ===");
  console.log("iss (issuer - wallet DID):", didDocument.id);
  console.log("aud (audience - issuer URL):", issuerUrl);
  console.log("nonce (c_nonce):", testNonce);

  // 3. Crea JWT Proof
  console.log("\n=== Generazione JWT Proof ===");
  const proofJwt = await createProofJWT(didDocument.id, issuerUrl, testNonce);

  console.log("\nJWT Proof completo:");
  console.log(proofJwt);

  // 4. Decodifica e mostra il contenuto
  console.log("\n=== Contenuto JWT Proof ===");
  const decoded = decodeJWT(proofJwt);
  console.log("Header:", JSON.stringify(decoded.header, null, 2));
  console.log("Payload:", JSON.stringify(decoded.payload, null, 2));

  // 5. Verifica formato kid
  console.log("\n=== Verifica formato kid ===");
  const kid = decoded.header.kid;
  console.log("kid nel JWT:", kid);
  console.log("kid è un URL valido:", kid.startsWith("did:"));
  console.log("kid include fragment (#):", kid.includes("#"));

  // 6. Suggerimenti
  console.log("\n=== Suggerimenti ===");
  if (didDocument.id.startsWith("did:key:")) {
    console.log("⚠️  Stai usando did:key: che potrebbe non essere risolvibile da EBSI");
    console.log("   Considera di usare did:ebsi: se EBSI lo richiede");
  }

  console.log("\n✅ JWT Proof generato con successo!");
  console.log("\nPer testare con EBSI:");
  console.log("1. Ottieni un c_nonce reale da EBSI token endpoint");
  console.log("2. Genera il JWT con il nonce reale");
  console.log("3. Invia al credential endpoint con il JWT proof");
}

main().catch((error) => {
  console.error("❌ Errore:", error);
  console.error(error.stack);
  process.exit(1);
});
