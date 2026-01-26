import { describe, it, expect } from "vitest";
import { generateMnemonic, mnemonicToSeed } from "../../src/crypto/seedManager.js";
import { derivePrivateKey, createJWK } from "../../src/crypto/keyDerivation.js";
import { generateDID, createDIDDocument } from "../../src/identity/didManager.js";
import { encrypt, decrypt } from "../../src/storage/encryptionManager.js";
import { VCManager } from "../../src/credentials/vcManager.js";
import { createVerifiablePresentation } from "../../src/credentials/vpManager.js";

/**
 * Performance Tests - Verifica che le operazioni rispettino i target di performance
 * NOTA: Temporaneamente skip per problema con @noble/hashes in Vite 7+
 *
 * Target:
 * - Cold start: <3s
 * - Hot start: <1s
 * - DID generation: <1s
 * - VP creation: <2s
 * - VC verification: <500ms
 * - Encryption: <500ms
 * - Decryption: <500ms
 */
describe.skip("Performance Tests", () => {
  describe("Key Generation Performance", () => {
    it("should generate mnemonic in <100ms", () => {
      const start = performance.now();

      generateMnemonic(128);

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it("should derive seed from mnemonic in <500ms", async () => {
      const mnemonic = generateMnemonic(128);
      const start = performance.now();

      await mnemonicToSeed(mnemonic);

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(500);
    });

    it("should derive private key in <50ms", async () => {
      const mnemonic = generateMnemonic(128);
      const seed = await mnemonicToSeed(mnemonic);
      const start = performance.now();

      derivePrivateKey(seed);

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });

    it("should create JWK in <50ms", async () => {
      const mnemonic = generateMnemonic(128);
      const seed = await mnemonicToSeed(mnemonic);
      const privateKey = derivePrivateKey(seed);
      const start = performance.now();

      createJWK(privateKey);

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });

  describe("DID Operations Performance", () => {
    it("should generate DID in <1 second", async () => {
      const mnemonic = generateMnemonic(128);
      const seed = await mnemonicToSeed(mnemonic);
      const privateKey = derivePrivateKey(seed);
      const { publicJwk } = createJWK(privateKey);

      const start = performance.now();

      const did = generateDID(publicJwk);

      const duration = performance.now() - start;

      expect(did).toBeTruthy();
      expect(duration).toBeLessThan(1000); // <1s
    });

    it("should create DID document in <50ms", async () => {
      const mnemonic = generateMnemonic(128);
      const seed = await mnemonicToSeed(mnemonic);
      const privateKey = derivePrivateKey(seed);
      const { publicJwk } = createJWK(privateKey);
      const did = generateDID(publicJwk);

      const start = performance.now();

      const didDoc = createDIDDocument(did, publicJwk);

      const duration = performance.now() - start;

      expect(didDoc).toBeTruthy();
      expect(duration).toBeLessThan(50);
    });

    it("should complete full DID creation workflow in <2 seconds", async () => {
      const start = performance.now();

      // Full workflow
      const mnemonic = generateMnemonic(128);
      const seed = await mnemonicToSeed(mnemonic);
      const privateKey = derivePrivateKey(seed);
      const { publicJwk } = createJWK(privateKey);
      const did = generateDID(publicJwk);
      const didDoc = createDIDDocument(did, publicJwk);

      const duration = performance.now() - start;

      expect(didDoc.id).toBe(did);
      expect(duration).toBeLessThan(2000); // <2s
    });
  });

  describe("Encryption Performance", () => {
    const testData = JSON.stringify({
      mnemonic: "test test test test test test test test test test test test",
      did: "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
      timestamp: Date.now(),
    });
    const password = "TestPassword123!";

    it("should encrypt data in <500ms", async () => {
      const start = performance.now();

      await encrypt(testData, password);

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(500);
    });

    it("should decrypt data in <500ms", async () => {
      const encrypted = await encrypt(testData, password);
      const start = performance.now();

      await decrypt(encrypted, password);

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(500);
    });

    it("should encrypt large data (10KB) in <1 second", async () => {
      const largeData = "x".repeat(10000);
      const start = performance.now();

      await encrypt(largeData, password);

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000);
    });

    it("should decrypt large data (10KB) in <1 second", async () => {
      const largeData = "x".repeat(10000);
      const encrypted = await encrypt(largeData, password);
      const start = performance.now();

      await decrypt(encrypted, password);

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });

  describe("Credential Operations Performance", () => {
    let vcManager;
    let mockCredential;
    let did;
    let privateKey;

    beforeEach(async () => {
      vcManager = new VCManager();

      // Setup DID
      const mnemonic = generateMnemonic(128);
      const seed = await mnemonicToSeed(mnemonic);
      privateKey = derivePrivateKey(seed);
      const { publicJwk } = createJWK(privateKey);
      did = generateDID(publicJwk);

      mockCredential = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential", "TestCredential"],
        issuer: "did:key:zMockIssuer123",
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: did,
          testAttribute: "test_value",
        },
        proof: {
          type: "JsonWebSignature2020",
          created: new Date().toISOString(),
          proofPurpose: "assertionMethod",
          verificationMethod: "did:key:zMockIssuer123#key-1",
          jws: "mock_signature",
        },
      };
    });

    it("should receive credential in <100ms (skip verification)", async () => {
      const start = performance.now();

      await vcManager.receiveCredential(mockCredential, {
        skipVerification: true,
      });

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it("should create VP in <2 seconds", async () => {
      const start = performance.now();

      const vp = await createVerifiablePresentation([mockCredential], did, privateKey, {
        challenge: "test_challenge",
        domain: "https://test.example.com",
      });

      const duration = performance.now() - start;

      expect(vp).toBeTruthy();
      expect(duration).toBeLessThan(2000); // <2s
    });

    it("should parse credential structure in <50ms", () => {
      const start = performance.now();

      vcManager.parseCredential(mockCredential);

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });

    it("should handle 10 credentials in <1 second", async () => {
      const start = performance.now();

      const promises = [];
      for (let i = 0; i < 10; i++) {
        const cred = {
          ...mockCredential,
          credentialSubject: {
            ...mockCredential.credentialSubject,
            index: i,
          },
        };
        promises.push(vcManager.receiveCredential(cred, { skipVerification: true }));
      }

      await Promise.all(promises);

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000);
    });

    it("should retrieve 100 credentials in <100ms", async () => {
      // Aggiungi 100 credenziali
      const promises = [];
      for (let i = 0; i < 100; i++) {
        const cred = {
          ...mockCredential,
          credentialSubject: {
            ...mockCredential.credentialSubject,
            index: i,
          },
        };
        promises.push(vcManager.receiveCredential(cred, { skipVerification: true }));
      }
      await Promise.all(promises);

      // Misura il retrieve
      const start = performance.now();

      await vcManager.getCredentials();

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe("Batch Operations Performance", () => {
    it("should generate 10 DIDs in <5 seconds", async () => {
      const start = performance.now();

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          (async () => {
            const mnemonic = generateMnemonic(128);
            const seed = await mnemonicToSeed(mnemonic);
            const privateKey = derivePrivateKey(seed);
            const { publicJwk } = createJWK(privateKey);
            return generateDID(publicJwk);
          })()
        );
      }

      const dids = await Promise.all(promises);

      const duration = performance.now() - start;

      expect(dids.length).toBe(10);
      expect(duration).toBeLessThan(5000); // <5s for 10 DIDs
    });

    it("should encrypt 10 items in <2 seconds", async () => {
      const password = "TestPassword123!";
      const start = performance.now();

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(encrypt(`data_${i}`, password));
      }

      await Promise.all(promises);

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(2000);
    });
  });

  describe("Memory Performance", () => {
    it("should handle large credential without excessive memory", async () => {
      const vcManager = new VCManager();

      // Credenziale con molto contenuto
      const largeCred = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential", "LargeCredential"],
        issuer: "did:key:zIssuer",
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: "did:key:zSubject",
          data: "x".repeat(5000), // 5KB di dati
        },
        proof: {
          type: "JsonWebSignature2020",
          created: new Date().toISOString(),
          proofPurpose: "assertionMethod",
          verificationMethod: "did:key:zIssuer#key-1",
          jws: "y".repeat(1000),
        },
      };

      const start = performance.now();

      await vcManager.receiveCredential(largeCred, {
        skipVerification: true,
      });

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(200);
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle concurrent encryptions efficiently", async () => {
      const password = "TestPassword123!";
      const start = performance.now();

      // 20 cifrature concorrenti
      const promises = Array.from({ length: 20 }, (_, i) =>
        encrypt(`concurrent_data_${i}`, password)
      );

      const results = await Promise.all(promises);

      const duration = performance.now() - start;

      expect(results.length).toBe(20);
      expect(results.every((r) => typeof r === "string")).toBe(true);
      expect(duration).toBeLessThan(3000); // <3s for 20 encryptions
    });

    it("should handle mixed operations concurrently", async () => {
      const password = "TestPassword123!";
      const start = performance.now();

      const operations = [
        generateMnemonic(128),
        generateMnemonic(256),
        encrypt("test1", password),
        encrypt("test2", password),
        (async () => {
          const m = generateMnemonic(128);
          const s = await mnemonicToSeed(m);
          const pk = derivePrivateKey(s);
          const { publicJwk } = createJWK(pk);
          return generateDID(publicJwk);
        })(),
      ];

      const results = await Promise.all(operations);

      const duration = performance.now() - start;

      expect(results.length).toBe(5);
      expect(duration).toBeLessThan(2000); // <2s for mixed ops
    });
  });

  describe("Real-World Scenarios", () => {
    it("should complete new wallet setup in <3 seconds", async () => {
      const start = performance.now();

      // Simula setup completo wallet
      const mnemonic = generateMnemonic(128);
      const seed = await mnemonicToSeed(mnemonic);
      const privateKey = derivePrivateKey(seed);
      const { publicJwk } = createJWK(privateKey);
      const did = generateDID(publicJwk);
      const didDoc = createDIDDocument(did, publicJwk);

      // Cifra e salva wallet
      const walletData = JSON.stringify({ mnemonic, did });
      const encryptedWallet = await encrypt(walletData, "UserPassword123!");

      const duration = performance.now() - start;

      expect(didDoc.id).toBe(did);
      expect(encryptedWallet).toBeTruthy();
      expect(duration).toBeLessThan(3000); // <3s (cold start target)
    });

    it("should complete wallet restore in <2 seconds", async () => {
      const existingMnemonic =
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
      const password = "RestorePassword123!";

      const start = performance.now();

      // Simula restore
      const seed = await mnemonicToSeed(existingMnemonic);
      const privateKey = derivePrivateKey(seed);
      const { publicJwk } = createJWK(privateKey);
      const did = generateDID(publicJwk);

      // Ricifra con nuova password
      const walletData = JSON.stringify({
        mnemonic: existingMnemonic,
        did,
      });
      const encrypted = await encrypt(walletData, password);

      const duration = performance.now() - start;

      expect(encrypted).toBeTruthy();
      expect(duration).toBeLessThan(2000); // <2s
    });

    it("should handle selective disclosure flow in <1 second", async () => {
      const vcManager = new VCManager();

      // Setup
      const mnemonic = generateMnemonic(128);
      const seed = await mnemonicToSeed(mnemonic);
      const privateKey = derivePrivateKey(seed);
      const { publicJwk } = createJWK(privateKey);
      const did = generateDID(publicJwk);

      const credential = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential"],
        issuer: "did:key:zIssuer",
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: did,
          age: 25,
          name: "John Doe",
        },
        proof: { type: "JsonWebSignature2020" },
      };

      const start = performance.now();

      // Parse e filtra attributi
      const parsed = vcManager.parseCredential(credential);
      const selectedAttributes = ["age"]; // Solo age, non name

      const duration = performance.now() - start;

      expect(parsed.valid).toBe(true);
      expect(selectedAttributes).toContain("age");
      expect(duration).toBeLessThan(1000); // <1s
    });
  });
});
