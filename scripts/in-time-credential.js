import { createJWK, derivePrivateKey } from "../src/crypto/keyDerivation.js";
import { generateMnemonic, mnemonicToSeed } from "../src/crypto/seedManager.js";
import { createDIDDocument, generateDID } from "../src/identity/didManager.js";

/* 
    CREAZIONE DID
*/

const mnemonic = generateMnemonic();

const seed = await mnemonicToSeed(mnemonic);

const privateKey = derivePrivateKey(seed);

const { privateJwk, publicJwk } = createJWK(privateKey);

const did = generateDID(publicJwk);

const didDocument = createDIDDocument(did, publicJwk);

console.log("\nDerived DID:\n", did);
console.log("=================================\n");

/* 
    CREDENTIAL OFFERING
*/

const getQRCodeData = () => {
  return new Promise((resolve) => {
    console.log("APP-EBSI: Inserisci i dati del QR Code (termina con Invio):");
    console.log("=================================\n");
    let inputData = "";

    const onData = (chunk) => {
      const input = chunk.toString();
      if (input.includes("\n")) {
        inputData += input;
        process.stdin.removeListener("data", onData);
        process.stdin.pause();
        resolve(inputData.trim());
      } else {
        inputData += input;
      }
    };

    process.stdin.on("data", onData);
  });
};

const qrCodeData = await getQRCodeData();
console.log("APP-EBSI: QR Code Data ricevuto:", qrCodeData);
console.log("=================================\n");

const url = qrCodeData.replace("openid-credential-offer://?credential_offer_uri=", "");
console.log("APP-EBSI: Credential Offer URL estratto dal QR Code:", url);
console.log("=================================\n");

const credentialOfferUrl = decodeURIComponent(url);
console.log("APP-EBSI: Credential Offer URL decodificato:", credentialOfferUrl);
console.log("=================================\n");

/* 
    DISCOVERY
*/

const credentialOfferResponse = await fetch(credentialOfferUrl);
const credentialOffer = await credentialOfferResponse.json();

console.log("APP-EBSI: Credential Offer ricevuto:", JSON.stringify(credentialOffer, null, 2));
console.log("=================================\n");

const issuerUrl = credentialOffer.credential_issuer;
console.log("APP-EBSI: Recupero OpenID Credential Issuer da:", issuerUrl);
const issuerResponse = await fetch(`${issuerUrl}/.well-known/openid-credential-issuer`);
const issuerInfo = await issuerResponse.json();
console.log("APP-EBSI: OpenID Credential Issuer Info:", JSON.stringify(issuerInfo, null, 2));
console.log("=================================\n");

console.log("APP-EBSI: Recupero OpenID Configuration da:", issuerInfo.authorization_server);
const configResponse = await fetch(
  issuerInfo.authorization_server + "/.well-known/openid-configuration"
);
const openidConfig = await configResponse.json();
console.log("APP-EBSI: OpenID Configuration:", JSON.stringify(openidConfig, null, 2));
console.log("=================================\n");

/* 
    TEST SPECIFIC CALLS
*/
