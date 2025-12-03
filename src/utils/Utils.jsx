import { util } from "@cef-ebsi/key-did-resolver";
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import { exportJWK, generateKeyPair } from 'jose';

export const PRIVATE_KEY_ID = 'walletPrivateKey';
export const PUBLIC_KEY_ID = 'walletPublicKey';
export const DID_KEY_ID = 'walletDid';

export async function generateDid() {
    try {
        // Generate an EC key pair for ES256 (P-256) and make keys extractable
        // so they can be exported as JWKs with `exportJWK`.
        const { publicKey, privateKey } = await generateKeyPair('ES256', {
            extractable: true,
            keyUsages: ['sign', 'verify'],
        });

        // Export keys to JWK format (privateJwk will include `d`)
        const privateJwk = await exportJWK(privateKey);
        const publicJwk = await exportJWK(publicKey);

        // Persist JWKs in secure storage as JSON strings
        await SecureStoragePlugin.set({ key: PRIVATE_KEY_ID, value: JSON.stringify(privateJwk) });
        await SecureStoragePlugin.set({ key: PUBLIC_KEY_ID, value: JSON.stringify(publicJwk) });

        // Create a DID from the public JWK
        const did = util.createDid(publicJwk);

        // Store the DID as well
        await SecureStoragePlugin.set({ key: DID_KEY_ID, value: did });

        // Return useful objects for immediate use
        return { did, publicJwk, privateJwk };
    } catch (err) {
        console.error('generateDid error:', err);
        throw err;
    }
}

export async function getDid() {
    try {
        const result = await SecureStoragePlugin.get({ key: DID_KEY_ID });
        return result.value;
    } catch (err) {
        console.error('getDid error:', err);
        throw err;
    }
}

export async function getKeyPair() {
    try {
        const privateResult = await SecureStoragePlugin.get({ key: PRIVATE_KEY_ID });
        const publicResult = await SecureStoragePlugin.get({ key: PUBLIC_KEY_ID });

        const privateJwk = JSON.parse(privateResult.value);
        const publicJwk = JSON.parse(publicResult.value);

        return { privateJwk, publicJwk };
    } catch (err) {
        console.error('getKeyPair error:', err);
        throw err;
    }
}