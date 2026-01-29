#!/usr/bin/env node

import { EBSIClient } from "../src/api/ebsiClient.js";

async function testConnection() {
  console.log("APP-EBSI: 🔍 Testing EBSI API Connection...\n");

  const client = new EBSIClient();

  try {
    // 1. Health check
    console.log("APP-EBSI: 1. Health Check...");
    const health = await client.healthCheck();
    console.log("APP-EBSI: ✅ API is healthy:", health);
    console.log();

    // 2. Get trusted issuers
    console.log("APP-EBSI: 2. Getting Trusted Issuers...");
    const issuers = await client.getTrustedIssuers({ limit: 5 });
    console.log(`✅ Found ${issuers.total} trusted issuers`);
    console.log("APP-EBSI: First issuer:", issuers.items[0]);
    console.log();

    // 3. Resolve a DID (se ne hai uno)
    // const did = 'did:ebsi:your-did-here';
    // console.log('3. Resolving DID...');
    // const didDoc = await client.resolveDID(did);
    // console.log('✅ DID Document:', didDoc);

    console.log("APP-EBSI: \n✅ All tests passed!");
  } catch (error) {
    console.error("APP-EBSI: ❌ Error:", error.message);
    if (error.details) {
      console.error("APP-EBSI: Details:", error.details);
    }
    process.exit(1);
  }
}

testConnection();
