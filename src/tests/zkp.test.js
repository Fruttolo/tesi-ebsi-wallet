import { describe, it, expect } from "vitest";
import { createAgeProof, verifyAgeProof } from "../credentials/zkp/ageProof";
import { createRangeProof, verifyRangeProof } from "../credentials/zkp/rangeProof";

describe("Zero-Knowledge Proofs", () => {
  describe("Age Proof", () => {
    it("should create proof for valid age", async () => {
      const dateOfBirth = "1990-01-15";
      const minAge = 18;
      const secret = crypto.getRandomValues(new Uint8Array(32));

      const proof = await createAgeProof(dateOfBirth, minAge, secret);

      expect(proof.type).toBe("AgeProofOverXYears");
      expect(proof.minAge).toBe(minAge);
      expect(proof.commitment).toBeDefined();
    });

    it("should throw error for insufficient age", async () => {
      const dateOfBirth = "2020-01-15"; // Too young
      const minAge = 18;
      const secret = crypto.getRandomValues(new Uint8Array(32));

      await expect(createAgeProof(dateOfBirth, minAge, secret)).rejects.toThrow();
    });

    it("should verify valid age proof", async () => {
      const dateOfBirth = "1990-01-15";
      const minAge = 18;
      const secret = crypto.getRandomValues(new Uint8Array(32));

      const proof = await createAgeProof(dateOfBirth, minAge, secret);
      const isValid = verifyAgeProof(proof);

      expect(isValid).toBe(true);
    });
  });

  describe("Range Proof", () => {
    it("should create proof for value in range", async () => {
      const value = 50;
      const min = 0;
      const max = 100;

      const proof = await createRangeProof(value, min, max);

      expect(proof.type).toBe("RangeProof");
      expect(proof.range.min).toBe(min);
      expect(proof.range.max).toBe(max);
      expect(proof.commitment).toBeDefined();
    });

    it("should throw error for value out of range", async () => {
      const value = 150;
      const min = 0;
      const max = 100;

      await expect(createRangeProof(value, min, max)).rejects.toThrow();
    });

    it("should verify valid range proof", async () => {
      const value = 50;
      const min = 0;
      const max = 100;

      const proof = await createRangeProof(value, min, max);
      const isValid = verifyRangeProof(proof);

      expect(isValid).toBe(true);
    });
  });
});
