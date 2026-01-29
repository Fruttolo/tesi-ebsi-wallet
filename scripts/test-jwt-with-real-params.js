#!/usr/bin/env node
/**
 * Script per testare JWT Proof con parametri reali dalla richiesta EBSI
 */

import { getDIDDocument } from "../src/storage/didStorage.js";
import { createProofJWT, decodeJWT } from "../src/crypto/jwtUtils.js";

async function main() {
  console.log("APP-EBSI: === Test JWT Proof con parametri reali ===\n");

  // 1. Carica DID esistente
  const didDocument = await getDIDDocument();
  if (!didDocument || !didDocument.id) {
    console.error("APP-EBSI: ❌ DID non trovato. Crea prima un'identità nel wallet.");
    process.exit(1);
  }

  console.log("APP-EBSI: DID del wallet:", didDocument.id);
  console.log("APP-EBSI: DID Document:");
  console.log(JSON.stringify(didDocument, null, 2));

  // 2. Parametri per la richiesta EBSI
  const issuerUrl = "https://api-conformance.ebsi.eu/conformance/v3/issuer-mock";
  const testNonce = "test-nonce-12345"; // Sostituisci con c_nonce reale dalla risposta token

  console.log("APP-EBSI: \n=== Parametri JWT Proof ===");
  console.log("APP-EBSI: iss (issuer - wallet DID):", didDocument.id);
  console.log("APP-EBSI: aud (audience - issuer URL):", issuerUrl);
  console.log("APP-EBSI: nonce (c_nonce):", testNonce);

  // 3. Crea JWT Proof
  console.log("APP-EBSI: \n=== Generazione JWT Proof ===");
  const proofJwt = await createProofJWT(didDocument.id, issuerUrl, testNonce);

  console.log("APP-EBSI: \nJWT Proof completo:");
  console.log(proofJwt);

  // 4. Decodifica e mostra il contenuto
  console.log("APP-EBSI: \n=== Contenuto JWT Proof ===");
  const decoded = decodeJWT(proofJwt);
  console.log("APP-EBSI: Header:", JSON.stringify(decoded.header, null, 2));
  console.log("APP-EBSI: Payload:", JSON.stringify(decoded.payload, null, 2));

  // 5. Verifica formato kid
  console.log("APP-EBSI: \n=== Verifica formato kid ===");
  const kid = decoded.header.kid;
  console.log("APP-EBSI: kid nel JWT:", kid);
  console.log("APP-EBSI: kid è un URL valido:", kid.startsWith("did:"));
  console.log("APP-EBSI: kid include fragment (#):", kid.includes("#"));

  // 6. Suggerimenti
  console.log("APP-EBSI: \n=== Suggerimenti ===");
  if (didDocument.id.startsWith("did:key:")) {
    console.log("APP-EBSI: ⚠️  Stai usando did:key: che potrebbe non essere risolvibile da EBSI");
    console.log("APP-EBSI:    Considera di usare did:ebsi: se EBSI lo richiede");
  }

  console.log("APP-EBSI: \n✅ JWT Proof generato con successo!");
  console.log("APP-EBSI: \nPer testare con EBSI:");
  console.log("APP-EBSI: 1. Ottieni un c_nonce reale da EBSI token endpoint");
  console.log("APP-EBSI: 2. Genera il JWT con il nonce reale");
  console.log("APP-EBSI: 3. Invia al credential endpoint con il JWT proof");
}

main().catch((error) => {
  console.error("APP-EBSI: ❌ Errore:", error);
  console.error(error.stack);
  process.exit(1);
});
