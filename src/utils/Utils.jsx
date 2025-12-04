import { util } from "@cef-ebsi/key-did-resolver";
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import { ES256Signer } from "did-jwt";
import { createVerifiableCredentialJwt } from "@cef-ebsi/verifiable-credential";
import * as bip39 from 'bip39';
import { ec as EC } from 'elliptic';


const PRIVATE_KEY_ID = import.meta.env.VITE_PRIVATE_KEY_ID || 'walletPrivateKey';
const PUBLIC_KEY_ID = import.meta.env.VITE_PUBLIC_KEY_ID || 'walletPublicKey';
const DID_KEY_ID = import.meta.env.VITE_DID_KEY_ID || 'walletDid';

const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || 'test';
const HOST = import.meta.env.VITE_HOST || 'api-test.ebsi.eu';

export async function generateDid() {
    try {
        // Generate a 12-word mnemonic (BIP39) and derive deterministic P-256 keys
        const mnemonic = bip39.generateMnemonic(); // 12 words

        // Derive seed from mnemonic and take first 32 bytes as private scalar
        const seed = await bip39.mnemonicToSeed(mnemonic);
        
        const privBytes = seed.slice(0, 32);

        // Use elliptic to generate the key pair
        const ec = new EC('p256');
        const key = ec.keyFromPrivate(privBytes);
        const pub = key.getPublic();

        // Convert keys to JWK format
        const hexToUint8 = (hex) => {
            if (hex.length % 2) hex = '0' + hex;
            const arr = new Uint8Array(hex.length / 2);
            for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.substr(i * 2, 2), 16);
            return arr;
        };

        const toBase64Url = (u8) => {
            let bin = '';
            for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
            const b64 = btoa(bin);
            return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        };

        const xHex = pub.getX().toString('hex').padStart(64, '0');
        const yHex = pub.getY().toString('hex').padStart(64, '0');
        const dHex = key.getPrivate().toString('hex').padStart(64, '0');

        const x = toBase64Url(hexToUint8(xHex));
        const y = toBase64Url(hexToUint8(yHex));
        const d = toBase64Url(hexToUint8(dHex));

        const privateJwk = { kty: 'EC', crv: 'P-256', x, y, d, ext: true };
        const publicJwk = { kty: 'EC', crv: 'P-256', x, y, ext: true };

        // Persist JWKs in secure storage as JSON strings
        await SecureStoragePlugin.set({ key: PRIVATE_KEY_ID, value: JSON.stringify(privateJwk) });
        await SecureStoragePlugin.set({ key: PUBLIC_KEY_ID, value: JSON.stringify(publicJwk) });

        // Create a DID from the public JWK
        const did = util.createDid(publicJwk);

        // Store the DID as well
        await SecureStoragePlugin.set({ key: DID_KEY_ID, value: did });

        // Return useful objects for immediate use, include mnemonic backup (12 words)
        return mnemonic;
    } catch (err) {
        console.error('generateDid error:', err);
        throw err;
    }
}

export async function restoreDid(mnemonic) {
    try {
        if (!mnemonic) throw new Error('No mnemonic provided');
        const valid = bip39.validateMnemonic(mnemonic);
        if (!valid) throw new Error('Invalid mnemonic provided');

        const seed = await bip39.mnemonicToSeed(mnemonic);
        const privBytes = seed.slice(0, 32);

        const ec = new EC('p256');
        const key = ec.keyFromPrivate(privBytes);
        const pub = key.getPublic();

        const hexToUint8 = (hex) => {
            if (hex.length % 2) hex = '0' + hex;
            const arr = new Uint8Array(hex.length / 2);
            for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.substr(i * 2, 2), 16);
            return arr;
        };

        const toBase64Url = (u8) => {
            let bin = '';
            for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
            const b64 = btoa(bin);
            return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        };

        const xHex = pub.getX().toString('hex').padStart(64, '0');
        const yHex = pub.getY().toString('hex').padStart(64, '0');
        const dHex = key.getPrivate().toString('hex').padStart(64, '0');

        const x = toBase64Url(hexToUint8(xHex));
        const y = toBase64Url(hexToUint8(yHex));
        const d = toBase64Url(hexToUint8(dHex));

        const privateJwk = { kty: 'EC', crv: 'P-256', x, y, d, ext: true };
        const publicJwk = { kty: 'EC', crv: 'P-256', x, y, ext: true };

        // Create DID from the public JWK and persist all
        const did = util.createDid(publicJwk);
        await SecureStoragePlugin.set({ key: PRIVATE_KEY_ID, value: JSON.stringify(privateJwk) });
        await SecureStoragePlugin.set({ key: PUBLIC_KEY_ID, value: JSON.stringify(publicJwk) });
        await SecureStoragePlugin.set({ key: DID_KEY_ID, value: did });

        return { did, publicJwk, privateJwk };
    } catch (err) {
        console.error('restoreDid error:', err);
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

export async function createVC(claims, schemaId) {
    try {
        // Load stored DID and key pair (JWKs)
        const did = await SecureStoragePlugin.get({ key: DID_KEY_ID });
        const privateJwk = await SecureStoragePlugin.get({ key: PRIVATE_KEY_ID });
        const publicJwk = await SecureStoragePlugin.get({ key: PUBLIC_KEY_ID });

        if (!did) throw new Error('No DID found in secure storage');
        if (!privateJwk) throw new Error('No private key found in secure storage');
        if (!schemaId) throw new Error('No schemaId provided for VC creation');

        // For did:key the fragment identifier is usually the multibase fingerprint
        // which equals the DID without the `did:key:` prefix. Use that as fragment.
        const fragment = did.startsWith('did:key:') ? did.replace('did:key:', '') : did;
        const kid = `${did}#${fragment}`;

        // Build issuer object expected by the library
        const issuer = {
            did,
            kid,
            alg: 'ES256',
            signer: ES256Signer(privateJwk),
        };

        const today = new Date().toISOString();

        // Ensure the payload contains the issuer
        const vcPayload = {
            ...claims,

            issuer: did,
            issuanceDate: today,
            validFrom: today,
            issued: today,
            credentialSubject: {
                id: did
            },
            credentialSchema: {
                id: "https://" + HOST + "/trusted-schemas-registry/v3/schemas/" + schemaId,
                type: "JsonSchemaValidator2021"
            }
        };

        const config = { 
            hosts: [HOST],
            scheme: "ebsi",
            network: {
                name: ENVIRONMENT,
                isOptional: false
            },
            services: {
                "did-registry": "v5",
                "trusted-issuers-registry": "v5",
                "trusted-policies-registry": "v3",
                "trusted-schemas-registry": "v3",
            },
        };

        const options = {
            timeout: 15000,
        };

        // Call library to create VC JWT
        const vcJwt = await createVerifiableCredentialJwt(vcPayload, issuer, config, options);

        return vcJwt;
    } catch (err) {
        console.error('createVC error:', err);
        throw err;
    }
}