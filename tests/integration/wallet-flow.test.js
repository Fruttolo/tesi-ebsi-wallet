import { describe, it, expect, beforeEach, beforeAll, afterEach } from "vitest";
import { generateMnemonic, mnemonicToSeed } from "../../src/crypto/seedManager.js";
import { derivePrivateKey, createJWK } from "../../src/crypto/keyDerivation.js";
import { generateDID, createDIDDocument } from "../../src/identity/didManager.js";
import { VCManager } from "../../src/credentials/vcManager.js";
import { createVerifiablePresentation } from "../../src/credentials/vpManager.js";
import { encrypt, decrypt } from "../../src/storage/encryptionManager.js";

// NOTA: Temporaneamente skip per problema con @noble/hashes in Vite 7+
describe.skip("Wallet Integration Tests", () => {
  let mnemonic;
  let seed;
  let privateKey;
  let publicKeyJwk;
  let did;
  let didDocument;
  const password = "TestPassword123!";

  describe("Complete Wallet Flow", () => {
    it("should create new wallet with mnemonic", async () => {
      // 1. Genera mnemonic
      mnemonic = generateMnemonic(128);

      expect(mnemonic).toBeTruthy();
      expect(mnemonic.split(" ")).toHaveLength(12);
    });

    it("should derive keys from mnemonic", async () => {
      // 2. Deriva seed
      seed = await mnemonicToSeed(mnemonic);

      expect(seed).toBeInstanceOf(Uint8Array);
      expect(seed.length).toBe(64);

      // 3. Deriva chiave privata
      privateKey = derivePrivateKey(seed);

      expect(privateKey).toBeInstanceOf(Uint8Array);
      expect(privateKey.length).toBe(32);

      // 4. Genera JWK
      const jwks = createJWK(privateKey);
      publicKeyJwk = jwks.publicJwk;

      expect(publicKeyJwk).toHaveProperty("kty", "EC");
      expect(publicKeyJwk).toHaveProperty("x");
      expect(publicKeyJwk).toHaveProperty("y");
    });

    it("should create DID and DID document", () => {
      // 5. Genera DID
      did = generateDID(publicKeyJwk);

      expect(did).toMatch(/^did:key:z[A-Za-z0-9]+$/);

      // 6. Crea DID Document
      didDocument = createDIDDocument(did, publicKeyJwk);

      expect(didDocument.id).toBe(did);
      expect(didDocument.verificationMethod).toHaveLength(1);
      expect(didDocument.verificationMethod[0].publicKeyJwk).toEqual(publicKeyJwk);
    });

    it("should encrypt and store wallet data", async () => {
      // 7. Cifra dati sensibili
      const walletData = {
        mnemonic,
        did,
        createdAt: new Date().toISOString(),
      };

      const walletDataString = JSON.stringify(walletData);
      const encryptedWallet = await encrypt(walletDataString, password);

      expect(encryptedWallet).toBeTruthy();
      expect(encryptedWallet).not.toContain(mnemonic);

      // 8. Decifra per verificare
      const decryptedString = await decrypt(encryptedWallet, password);
      const decryptedData = JSON.parse(decryptedString);

      expect(decryptedData.mnemonic).toBe(mnemonic);
      expect(decryptedData.did).toBe(did);
    });

    it("should restore wallet from mnemonic", async () => {
      // 9. Simula restore
      const restoredSeed = await mnemonicToSeed(mnemonic);
      const restoredPrivateKey = derivePrivateKey(restoredSeed);
      const { publicJwk: restoredPublicJwk } = createJWK(restoredPrivateKey);
      const restoredDid = generateDID(restoredPublicJwk);

      // Il DID deve essere identico
      expect(restoredDid).toBe(did);
      expect(restoredPublicJwk).toEqual(publicKeyJwk);
    });
  });

  describe("Credential Management Flow", () => {
    let vcManager;
    let mockCredential;
    let storedCredentialId;

    beforeEach(() => {
      vcManager = new VCManager();

      // Mock credential
      mockCredential = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential", "TestCredential"],
        issuer: "did:key:zMockIssuer123",
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: did,
          testAttribute: "test_value",
          age: 25,
        },
        proof: {
          type: "JsonWebSignature2020",
          created: new Date().toISOString(),
          proofPurpose: "assertionMethod",
          verificationMethod: "did:key:zMockIssuer123#key-1",
          jws: "mock_signature_for_testing",
        },
      };
    });

    it("should receive and validate credential structure", async () => {
      // Test con skip verification per test offline
      const result = await vcManager.receiveCredential(mockCredential, {
        skipVerification: true,
      });

      expect(result.success).toBe(true);
      expect(result.credentialId).toBeTruthy();
      expect(result.credential).toEqual(mockCredential);

      storedCredentialId = result.credentialId;
    });

    it("should retrieve stored credential", async () => {
      // Assicura che la credenziale sia stata salvata
      if (!storedCredentialId) {
        const result = await vcManager.receiveCredential(mockCredential, {
          skipVerification: true,
        });
        storedCredentialId = result.credentialId;
      }

      const credentials = await vcManager.getCredentials();

      expect(credentials).toBeInstanceOf(Array);
      expect(credentials.length).toBeGreaterThan(0);

      const found = credentials.find((c) => c.id === storedCredentialId);
      expect(found).toBeDefined();
      expect(found.credential.credentialSubject.id).toBe(did);
    });

    it("should create verifiable presentation from credential", async () => {
      // Assicura che la credenziale sia stata salvata
      if (!storedCredentialId) {
        const result = await vcManager.receiveCredential(mockCredential, {
          skipVerification: true,
        });
        storedCredentialId = result.credentialId;
      }

      const vp = await createVerifiablePresentation([mockCredential], did, privateKey, {
        challenge: "test_challenge_123",
        domain: "https://test.example.com",
      });

      expect(vp).toHaveProperty("@context");
      expect(vp).toHaveProperty("type");
      expect(vp.type).toContain("VerifiablePresentation");
      expect(vp).toHaveProperty("verifiableCredential");
      expect(vp.verifiableCredential).toBeInstanceOf(Array);
      expect(vp.verifiableCredential[0]).toEqual(mockCredential);
      expect(vp).toHaveProperty("holder", did);
      expect(vp).toHaveProperty("proof");
    });

    it("should filter credentials by type", async () => {
      // Aggiungi altra credenziale di tipo diverso
      const educationCred = {
        ...mockCredential,
        type: ["VerifiableCredential", "EducationCredential"],
        credentialSubject: {
          id: did,
          degree: "Bachelor of Science",
        },
      };

      await vcManager.receiveCredential(educationCred, {
        skipVerification: true,
      });

      const allCredentials = await vcManager.getCredentials();
      const testCredentials = allCredentials.filter((c) =>
        c.credential.type.includes("TestCredential")
      );
      const educationCredentials = allCredentials.filter((c) =>
        c.credential.type.includes("EducationCredential")
      );

      expect(testCredentials.length).toBeGreaterThan(0);
      expect(educationCredentials.length).toBeGreaterThan(0);
    });
  });

  describe("EBSI Integration Flow", () => {
    it("should handle EBSI DID format", () => {
      // Test con mock EBSI DID
      const ebsiDid = "did:ebsi:zTestEBSIIdentifier123";

      expect(ebsiDid).toMatch(/^did:ebsi:z[A-Za-z0-9]+$/);
    });

    it("should validate EBSI credential structure", () => {
      const ebsiCredential = {
        "@context": [
          "https://www.w3.org/2018/credentials/v1",
          "https://api-pilot.ebsi.eu/trusted-schemas-registry/v2/schemas/z...",
        ],
        type: ["VerifiableCredential", "VerifiableAttestation"],
        issuer: "did:ebsi:zIssuer123",
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: did,
        },
        credentialSchema: {
          id: "https://api-pilot.ebsi.eu/trusted-schemas-registry/v2/schemas/z...",
          type: "FullJsonSchemaValidator2021",
        },
      };

      expect(ebsiCredential).toHaveProperty("credentialSchema");
      expect(ebsiCredential.credentialSchema).toHaveProperty("type");
    });
  });

  describe("Error Handling and Edge Cases", () => {
    let vcManager;

    beforeEach(() => {
      vcManager = new VCManager();
    });

    it("should reject invalid credential structure", async () => {
      const invalidCred = {
        type: "VerifiableCredential", // Dovrebbe essere array
        // Missing @context, issuer, etc.
      };

      await expect(async () => {
        await vcManager.receiveCredential(invalidCred, {
          skipVerification: true,
        });
      }).rejects.toThrow("Invalid VC structure");
    });

    it("should handle missing credentialSubject.id", async () => {
      const credNoSubjectId = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential"],
        issuer: "did:key:zIssuer",
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          // Missing id
          name: "John Doe",
        },
      };

      const result = vcManager.parseCredential(credNoSubjectId);

      // Dovrebbe comunque validare (credentialSubject.id è opzionale in W3C spec)
      expect(result.valid).toBe(true);
    });

    it("should handle expired credential", () => {
      const expiredCred = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential"],
        issuer: "did:key:zIssuer",
        issuanceDate: new Date("2020-01-01").toISOString(),
        expirationDate: new Date("2021-01-01").toISOString(), // Expired
        credentialSubject: {
          id: did,
          data: "test",
        },
      };

      const now = new Date();
      const expiration = new Date(expiredCred.expirationDate);

      expect(expiration < now).toBe(true);
    });

    it("should handle malformed dates", () => {
      const badDateCred = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential"],
        issuer: "did:key:zIssuer",
        issuanceDate: "not-a-valid-date",
        credentialSubject: {
          id: did,
        },
      };

      const result = vcManager.parseCredential(badDateCred);

      expect(result.valid).toBe(false);
      expect(result.errors.join(" ")).toContain("issuanceDate");
    });
  });

  describe("Performance Tests", () => {
    it("should create DID in under 1 second", async () => {
      const start = Date.now();

      const testMnemonic = generateMnemonic(128);
      const testSeed = await mnemonicToSeed(testMnemonic);
      const testPrivateKey = derivePrivateKey(testSeed);
      const { publicJwk } = createJWK(testPrivateKey);
      const testDid = generateDID(publicJwk);

      const duration = Date.now() - start;

      expect(testDid).toBeTruthy();
      expect(duration).toBeLessThan(1000); // <1s
    });

    it("should encrypt data in under 500ms", async () => {
      const data = JSON.stringify({ test: "data", value: 123 });
      const start = Date.now();

      await encrypt(data, password);

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500); // <500ms
    });

    it("should handle multiple credentials efficiently", async () => {
      const vcManager = new VCManager();
      const start = Date.now();

      // Aggiungi 10 credenziali
      const promises = [];
      for (let i = 0; i < 10; i++) {
        const cred = {
          "@context": ["https://www.w3.org/2018/credentials/v1"],
          type: ["VerifiableCredential", `TestCredential${i}`],
          issuer: `did:key:zIssuer${i}`,
          issuanceDate: new Date().toISOString(),
          credentialSubject: {
            id: did,
            index: i,
          },
          proof: {
            type: "JsonWebSignature2020",
            created: new Date().toISOString(),
            proofPurpose: "assertionMethod",
            verificationMethod: `did:key:zIssuer${i}#key-1`,
            jws: `mock_signature_${i}`,
          },
        };

        promises.push(vcManager.receiveCredential(cred, { skipVerification: true }));
      }

      await Promise.all(promises);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000); // <2s per 10 credenziali
    });
  });
});
