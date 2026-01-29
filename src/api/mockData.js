/**
 * Mock data per testing offline
 */

export const MOCK_DID_DOCUMENT = {
  "@context": ["https://www.w3.org/ns/did/v1"],
  id: "did:ebsi:zMockDIDForTesting123456",
  verificationMethod: [
    {
      id: "did:ebsi:zMockDIDForTesting123456#key-1",
      type: "JsonWebKey2020",
      controller: "did:ebsi:zMockDIDForTesting123456",
      publicKeyJwk: {
        kty: "EC",
        crv: "secp256k1",
        x: "mock_x_coordinate",
        y: "mock_y_coordinate",
      },
    },
  ],
  authentication: ["did:ebsi:zMockDIDForTesting123456#key-1"],
};

export const MOCK_TRUSTED_ISSUERS = {
  total: 2,
  items: [
    {
      did: "did:ebsi:zMockIssuer1",
      name: "Mock University",
      active: true,
      attributes: ["EducationalCredential"],
    },
    {
      did: "did:ebsi:zMockIssuer2",
      name: "Mock Government",
      active: true,
      attributes: ["IDCredential"],
    },
  ],
};

export const MOCK_CREDENTIAL = {
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  type: ["VerifiableCredential", "EducationalCredential"],
  issuer: "did:ebsi:zMockIssuer1",
  issuanceDate: "2026-01-01T00:00:00Z",
  credentialSubject: {
    id: "did:ebsi:zMockDIDForTesting123456",
    degree: {
      type: "BachelorDegree",
      name: "Ingegneria Informatica",
    },
  },
  proof: {
    type: "JsonWebSignature2020",
    created: "2026-01-01T00:00:00Z",
    proofPurpose: "assertionMethod",
    verificationMethod: "did:ebsi:zMockIssuer1#key-1",
    jws: "mock_signature_value",
  },
};

/**
 * Mock EBSI Client per testing
 */
export class MockEBSIClient {
  async resolveDID(did) {
    await this._simulateDelay();
    return MOCK_DID_DOCUMENT;
  }

  async getTrustedIssuers() {
    await this._simulateDelay();
    return MOCK_TRUSTED_ISSUERS;
  }

  async isIssuerTrusted(did) {
    await this._simulateDelay();
    return MOCK_TRUSTED_ISSUERS.items.some((i) => i.did === did);
  }

  async healthCheck() {
    return { status: "ok", message: "Mock API healthy" };
  }

  _simulateDelay() {
    return new Promise((resolve) => setTimeout(resolve, 100));
  }
}
