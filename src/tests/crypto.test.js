import { describe, it, expect, beforeEach } from "vitest";
import {
  generateMnemonic,
  validateMnemonic,
  mnemonicToSeed,
  secureWipe,
} from "../crypto/seedManager.js";
import {
  derivePrivateKey,
  getPublicKey,
  publicKeyToHex,
  createJWK,
} from "../crypto/keyDerivation.js";

describe("Seed Manager", () => {
  it("should generate valid 12-word mnemonic", () => {
    const mnemonic = generateMnemonic(128);
    expect(mnemonic).toBeTruthy();
    expect(mnemonic.split(" ")).toHaveLength(12);
    expect(validateMnemonic(mnemonic)).toBe(true);
  });

  it("should generate valid 24-word mnemonic", () => {
    const mnemonic = generateMnemonic(256);
    expect(mnemonic).toBeTruthy();
    expect(mnemonic.split(" ")).toHaveLength(24);
    expect(validateMnemonic(mnemonic)).toBe(true);
  });

  it("should validate correct mnemonic", () => {
    const mnemonic =
      "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    expect(validateMnemonic(mnemonic)).toBe(true);
  });

  it("should reject invalid mnemonic", () => {
    const invalid = "invalid seed phrase test";
    expect(validateMnemonic(invalid)).toBe(false);
  });

  it("should derive seed from mnemonic", async () => {
    const mnemonic =
      "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    const seed = await mnemonicToSeed(mnemonic);
    expect(seed).toBeInstanceOf(Uint8Array);
    expect(seed.length).toBe(64);
  });

  it("should derive deterministic seed from same mnemonic", async () => {
    const mnemonic = generateMnemonic(128);
    const seed1 = await mnemonicToSeed(mnemonic);
    const seed2 = await mnemonicToSeed(mnemonic);

    expect(Buffer.from(seed1).toString("hex")).toBe(Buffer.from(seed2).toString("hex"));
  });

  it("should securely wipe array", () => {
    const arr = new Uint8Array([1, 2, 3, 4, 5]);
    secureWipe(arr);
    expect(arr.every((byte) => byte === 0)).toBe(true);
  });
});

describe("Key Derivation", () => {
  let testMnemonic;
  let testSeed;

  beforeEach(async () => {
    testMnemonic = generateMnemonic(128);
    testSeed = await mnemonicToSeed(testMnemonic);
  });

  it("should derive private key from seed", () => {
    const privateKey = derivePrivateKey(testSeed);
    expect(privateKey).toBeInstanceOf(Uint8Array);
    expect(privateKey.length).toBe(32);
  });

  it("should derive deterministic private key", () => {
    const privateKey1 = derivePrivateKey(testSeed);
    const privateKey2 = derivePrivateKey(testSeed);

    expect(Buffer.from(privateKey1).toString("hex")).toBe(Buffer.from(privateKey2).toString("hex"));
  });

  it("should generate public key from private key", () => {
    const privateKey = derivePrivateKey(testSeed);
    const publicKey = getPublicKey(privateKey);

    expect(publicKey).toBeInstanceOf(Uint8Array);
    expect(publicKey.length).toBe(65); // uncompressed P-256
  });

  it("should generate compressed public key", () => {
    const privateKey = derivePrivateKey(testSeed);
    const publicKey = getPublicKey(privateKey, true);

    expect(publicKey).toBeInstanceOf(Uint8Array);
    expect(publicKey.length).toBe(33); // compressed
  });

  it("should convert public key to hex", () => {
    const privateKey = derivePrivateKey(testSeed);
    const publicKey = getPublicKey(privateKey);
    const hex = publicKeyToHex(publicKey);

    expect(typeof hex).toBe("string");
    expect(hex).toMatch(/^[0-9a-f]+$/);
    expect(hex.length).toBe(130); // 65 bytes * 2
  });

  it("should create valid JWK from private key", () => {
    const privateKey = derivePrivateKey(testSeed);
    const { privateJwk, publicJwk } = createJWK(privateKey);

    // Verifica struttura JWK privata
    expect(privateJwk).toHaveProperty("kty", "EC");
    expect(privateJwk).toHaveProperty("crv", "P-256");
    expect(privateJwk).toHaveProperty("x");
    expect(privateJwk).toHaveProperty("y");
    expect(privateJwk).toHaveProperty("d"); // chiave privata
    expect(privateJwk).toHaveProperty("alg", "ES256");

    // Verifica struttura JWK pubblica
    expect(publicJwk).toHaveProperty("kty", "EC");
    expect(publicJwk).toHaveProperty("crv", "P-256");
    expect(publicJwk).toHaveProperty("x");
    expect(publicJwk).toHaveProperty("y");
    expect(publicJwk).not.toHaveProperty("d"); // no chiave privata
  });

  it("should throw error for invalid private key length", () => {
    const invalidKey = new Uint8Array(16); // wrong length
    expect(() => createJWK(invalidKey)).toThrow("Invalid private key");
  });
});

describe("Integration Tests", () => {
  it("should complete full key generation workflow", async () => {
    // 1. Genera mnemonic
    const mnemonic = generateMnemonic(128);
    expect(validateMnemonic(mnemonic)).toBe(true);

    // 2. Deriva seed
    const seed = await mnemonicToSeed(mnemonic);
    expect(seed).toBeInstanceOf(Uint8Array);

    // 3. Deriva chiave privata
    const privateKey = derivePrivateKey(seed);
    expect(privateKey.length).toBe(32);

    // 4. Genera chiave pubblica
    const publicKey = getPublicKey(privateKey);
    expect(publicKey).toBeInstanceOf(Uint8Array);

    // 5. Crea JWK
    const { privateJwk, publicJwk } = createJWK(privateKey);
    expect(privateJwk.d).toBeTruthy();
    expect(publicJwk.d).toBeUndefined();

    // 6. Cleanup
    secureWipe(seed);
    secureWipe(privateKey);
    expect(seed.every((b) => b === 0)).toBe(true);
  });
});
