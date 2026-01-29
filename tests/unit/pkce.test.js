import { describe, it, expect } from "vitest";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateRandomString,
} from "../../src/utils/pkce";

describe("PKCE Utilities", () => {
  describe("generateCodeVerifier", () => {
    it("should generate a URL-safe string", () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toBeTruthy();
      expect(typeof verifier).toBe("string");
      // Should not contain +, /, or =
      expect(verifier).not.toMatch(/[+/=]/);
    });

    it("should generate strings between 43 and 128 characters", () => {
      const verifier = generateCodeVerifier();
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
    });

    it("should generate different values each time", () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      expect(verifier1).not.toBe(verifier2);
    });
  });

  describe("generateCodeChallenge", () => {
    it("should generate a URL-safe base64 string", async () => {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      expect(challenge).toBeTruthy();
      expect(typeof challenge).toBe("string");
      // Should not contain +, /, or =
      expect(challenge).not.toMatch(/[+/=]/);
    });

    it("should generate consistent challenge for same verifier", async () => {
      const verifier = "test_code_verifier_12345678901234567890";
      const challenge1 = await generateCodeChallenge(verifier);
      const challenge2 = await generateCodeChallenge(verifier);
      expect(challenge1).toBe(challenge2);
    });

    it("should generate different challenges for different verifiers", async () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      const challenge1 = await generateCodeChallenge(verifier1);
      const challenge2 = await generateCodeChallenge(verifier2);
      expect(challenge1).not.toBe(challenge2);
    });

    it("should generate SHA-256 hash (43 characters in base64url)", async () => {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      // SHA-256 produces 32 bytes = 43 characters in base64url (without padding)
      expect(challenge.length).toBe(43);
    });
  });

  describe("generateRandomString", () => {
    it("should generate a random string", () => {
      const random = generateRandomString();
      expect(random).toBeTruthy();
      expect(typeof random).toBe("string");
    });

    it("should generate different values each time", () => {
      const random1 = generateRandomString();
      const random2 = generateRandomString();
      expect(random1).not.toBe(random2);
    });

    it("should be URL-safe", () => {
      const random = generateRandomString();
      expect(random).not.toMatch(/[+/=]/);
    });
  });

  describe("PKCE Flow Integration", () => {
    it("should complete a full PKCE flow", async () => {
      // 1. Generate code verifier
      const codeVerifier = generateCodeVerifier();
      expect(codeVerifier).toBeTruthy();

      // 2. Generate code challenge
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      expect(codeChallenge).toBeTruthy();

      // 3. Verify they are different
      expect(codeVerifier).not.toBe(codeChallenge);

      // 4. Verify lengths
      expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
      expect(codeChallenge.length).toBe(43);

      // 5. Verify URL-safe
      expect(codeVerifier).not.toMatch(/[+/=]/);
      expect(codeChallenge).not.toMatch(/[+/=]/);
    });
  });
});
