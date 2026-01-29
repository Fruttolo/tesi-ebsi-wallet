/**
 * EBSI API Test Script
 * Test connectivity and basic operations with EBSI Testnet
 */

const EBSI_API_BASE = "https://api-pilot.ebsi.eu";
const EBSI_EXPLORER = "https://api-pilot.ebsi.eu/explorer";

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEBSIConnection() {
  log("\n🔍 Testing EBSI API Connection...", "cyan");
  log("=".repeat(50), "blue");

  try {
    const response = await fetch(`${EBSI_API_BASE}/health`);

    if (response.ok) {
      log("✅ EBSI API Status: ONLINE", "green");
      log(`   Status Code: ${response.status}`, "green");

      try {
        const data = await response.json();
        log(`   Response: ${JSON.stringify(data, null, 2)}`, "green");
      } catch (e) {
        log(`   Response: ${await response.text()}`, "green");
      }
    } else {
      log(`❌ EBSI API Status: ERROR (${response.status})`, "red");
    }
  } catch (error) {
    log(`❌ Error connecting to EBSI: ${error.message}`, "red");
    log("   Check your internet connection or EBSI testnet availability", "yellow");
  }
}

async function testTimestampAPI() {
  log("\n🕐 Testing Timestamp API...", "cyan");
  log("=".repeat(50), "blue");

  try {
    const response = await fetch(`${EBSI_API_BASE}/timestamp/v5/timestamps`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (response.ok) {
      log("✅ Timestamp API: ACCESSIBLE", "green");
      const data = await response.json();
      log(`   Timestamps available: ${data.total || "N/A"}`, "green");
    } else {
      log(`⚠️  Timestamp API returned: ${response.status}`, "yellow");
      log("   This might require authentication", "yellow");
    }
  } catch (error) {
    log(`❌ Error accessing Timestamp API: ${error.message}`, "red");
  }
}

async function testDIDRegistry() {
  log("\n🆔 Testing DID Registry API...", "cyan");
  log("=".repeat(50), "blue");

  try {
    const response = await fetch(`${EBSI_API_BASE}/did-registry/v5/identifiers`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (response.ok) {
      log("✅ DID Registry API: ACCESSIBLE", "green");
    } else {
      log(`⚠️  DID Registry returned: ${response.status}`, "yellow");
      log("   This might require authentication", "yellow");
    }
  } catch (error) {
    log(`❌ Error accessing DID Registry: ${error.message}`, "red");
  }
}

async function testTrustedIssuersRegistry() {
  log("\n📋 Testing Trusted Issuers Registry API...", "cyan");
  log("=".repeat(50), "blue");

  try {
    const response = await fetch(`${EBSI_API_BASE}/trusted-issuers-registry/v5/issuers`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (response.ok) {
      log("✅ Trusted Issuers Registry: ACCESSIBLE", "green");
    } else {
      log(`⚠️  Trusted Issuers Registry returned: ${response.status}`, "yellow");
    }
  } catch (error) {
    log(`❌ Error accessing Trusted Issuers Registry: ${error.message}`, "red");
  }
}

async function testAPIInfo() {
  log("\n📖 Testing API Info Endpoint...", "cyan");
  log("=".repeat(50), "blue");

  try {
    const response = await fetch(`${EBSI_API_BASE}/docs`);

    if (response.ok) {
      log("✅ API Documentation: ACCESSIBLE", "green");
      log(`   Visit: ${EBSI_API_BASE}/docs`, "cyan");
    } else {
      log(`⚠️  API Docs returned: ${response.status}`, "yellow");
    }
  } catch (error) {
    log(`❌ Error accessing API docs: ${error.message}`, "red");
  }
}

async function runAllTests() {
  log("\n" + "=".repeat(50), "blue");
  log("  EBSI Testnet API Connection Test", "cyan");
  log("=".repeat(50), "blue");
  log(`  Base URL: ${EBSI_API_BASE}`, "yellow");
  log(`  Explorer: ${EBSI_EXPLORER}`, "yellow");
  log("=".repeat(50) + "\n", "blue");

  await testEBSIConnection();
  await testTimestampAPI();
  await testDIDRegistry();
  await testTrustedIssuersRegistry();
  await testAPIInfo();

  log("\n" + "=".repeat(50), "blue");
  log("  Test Summary", "cyan");
  log("=".repeat(50), "blue");
  log("  ℹ️  Some endpoints may require authentication (Bearer token)", "yellow");
  log("  ℹ️  Full API documentation: https://api-pilot.ebsi.eu/docs/", "yellow");
  log("  ℹ️  For testnet access, you may need to register at EBSI portal", "yellow");
  log("=".repeat(50) + "\n", "blue");
}

// Execute tests
runAllTests().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, "red");
  process.exit(1);
});
