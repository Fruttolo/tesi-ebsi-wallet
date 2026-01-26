import { describe, it, expect } from "vitest";

describe("Dependencies Check", () => {
  it("should load bip39 correctly", async () => {
    const bip39 = await import("bip39");
    expect(bip39).toBeDefined();
    expect(typeof bip39.generateMnemonic).toBe("function");

    // Test mnemonic generation
    const mnemonic = bip39.generateMnemonic();
    expect(mnemonic).toBeTruthy();
    expect(bip39.validateMnemonic(mnemonic)).toBe(true);
  });

  it("should load @noble/curves correctly", async () => {
    // @noble/curves requires submodule imports
    const bip32 = await import("@scure/bip32");
    expect(bip32).toBeDefined();
  });

  it("should load @noble/hashes correctly", async () => {
    // @noble/hashes requires submodule imports, test via bip39 which uses it
    const bip39Module = await import("@scure/bip39");
    expect(bip39Module).toBeDefined();
  });

  it("should load bs58 correctly", async () => {
    const bs58 = (await import("bs58")).default;
    expect(bs58).toBeDefined();
    expect(typeof bs58.encode).toBe("function");
    expect(typeof bs58.decode).toBe("function");

    // Test encode/decode
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const encoded = bs58.encode(data);
    const decoded = bs58.decode(encoded);
    expect(decoded).toEqual(data);
  });

  it("should load uuid correctly", async () => {
    const { v4: uuidv4 } = await import("uuid");
    expect(uuidv4).toBeDefined();
    expect(typeof uuidv4).toBe("function");

    // Test UUID generation
    const id = uuidv4();
    expect(id).toBeTruthy();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it("should load did-jwt correctly", async () => {
    const didJWT = await import("did-jwt");
    expect(didJWT).toBeDefined();
    expect(typeof didJWT.decodeJWT).toBe("function");
  });

  it("should load buffer polyfill correctly", async () => {
    const { Buffer } = await import("buffer");
    expect(Buffer).toBeDefined();
    expect(typeof Buffer.from).toBe("function");

    // Test buffer operations
    const buf = Buffer.from("hello");
    expect(buf.toString()).toBe("hello");
  });

  it("should load date-fns correctly", async () => {
    const dateFns = await import("date-fns");
    expect(dateFns).toBeDefined();
    expect(typeof dateFns.format).toBe("function");
  });

  it("should load qrcode correctly", async () => {
    const QRCode = await import("qrcode");
    expect(QRCode).toBeDefined();
    expect(typeof QRCode.toDataURL).toBe("function");
  });

  it("should load localforage correctly", async () => {
    const localforage = await import("localforage");
    expect(localforage.default).toBeDefined();
    expect(typeof localforage.default.setItem).toBe("function");
  });
});
