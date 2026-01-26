import { describe, it, expect, beforeEach } from "vitest";
import { EBSIClient, EBSIError } from "../../src/api/ebsiClient";
import { MockEBSIClient } from "../../src/api/mockData";

describe("EBSI Client", () => {
  let client;

  beforeEach(() => {
    // Usa mock per test offline
    client = new MockEBSIClient();
  });

  it("should resolve DID", async () => {
    const did = "did:ebsi:test123";
    const result = await client.resolveDID(did);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.verificationMethod).toBeInstanceOf(Array);
  });

  it("should get trusted issuers", async () => {
    const result = await client.getTrustedIssuers();

    expect(result).toBeDefined();
    expect(result.items).toBeInstanceOf(Array);
    expect(result.total).toBeGreaterThan(0);
  });

  it("should verify issuer trust status", async () => {
    const trustedDID = "did:ebsi:zMockIssuer1";
    const untrustedDID = "did:ebsi:zNotTrusted";

    const isTrusted = await client.isIssuerTrusted(trustedDID);
    const isUntrusted = await client.isIssuerTrusted(untrustedDID);

    expect(isTrusted).toBe(true);
    expect(isUntrusted).toBe(false);
  });

  it("should perform health check", async () => {
    const health = await client.healthCheck();
    expect(health.status).toBe("ok");
  });
});

describe("EBSI Error Handling", () => {
  it("should create EBSIError with details", () => {
    const error = new EBSIError("Test error", 404, { detail: "Not found" });

    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(404);
    expect(error.details).toEqual({ detail: "Not found" });
    expect(error.name).toBe("EBSIError");
  });
});
