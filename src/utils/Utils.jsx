import { generateMnemonic, mnemonicToSeed } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { HDKey } from '@scure/bip32';
import { p256 } from '@noble/curves/nist.js';
import { util } from "@cef-ebsi/key-did-resolver";
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

const PRIVATE_KEY_ID = import.meta.env.VITE_PRIVATE_KEY_ID || 'walletPrivateKey';
const PUBLIC_KEY_ID = import.meta.env.VITE_PUBLIC_KEY_ID || 'walletPublicKey';
const DID_KEY_ID = import.meta.env.VITE_DID_KEY_ID || 'walletDid';

const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || 'test';
const HOST = import.meta.env.VITE_HOST || 'api-test.ebsi.eu';

function uint8ToBase64Url(bytes) {
    // compatibile browser + node
    if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    // browser fallback
    let binary = '';
    const len = bytes.length;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function generateDid(mnemonic = null) {
    try {

        if (!mnemonic) {
            mnemonic = generateMnemonic(wordlist, 128);
        }
        
        const seed = await mnemonicToSeed(mnemonic);

        const hdKey = HDKey.fromMasterSeed(seed);

        const derivedKey = hdKey.derive("m/0'/0'/0'");

        const privateKeyBuffer = derivedKey.privateKey;
        
        if (!privateKeyBuffer)
            throw new Error('Failed to derive private key from mnemonic');

        if (privateKeyBuffer.length !== 32) {
            throw new Error('Unsupported private key length: ' + privateKeyBuffer.length);
        }

        const pubUncompressed = p256.getPublicKey(privateKeyBuffer, false); // false => uncompressed
        const x = pubUncompressed.slice(1, 33);
        const y = pubUncompressed.slice(33, 65);

        const d_b64 = uint8ToBase64Url(privateKeyBuffer);
        const x_b64 = uint8ToBase64Url(x);
        const y_b64 = uint8ToBase64Url(y);

        const privateJwk = {
            kty: 'EC',
            crv: 'P-256',
            x: x_b64,
            y: y_b64,
            d: d_b64,
            alg: 'ES256',
            ext: true
        };

        const publicJwk = {
            kty: 'EC',
            crv: 'P-256',
            x: x_b64,
            y: y_b64,
            alg: 'ES256',
            ext: true
        };

        const did = util.createDid(publicJwk);

        await SecureStoragePlugin.set({ key: PRIVATE_KEY_ID, value: JSON.stringify(privateJwk) });
        await SecureStoragePlugin.set({ key: PUBLIC_KEY_ID, value: JSON.stringify(publicJwk) });
        await SecureStoragePlugin.set({ key: DID_KEY_ID, value: did });

        return mnemonic;
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

export async function getPublicKeyJwk() {
    try {
        const result = await SecureStoragePlugin.get({ key: PUBLIC_KEY_ID });
        return JSON.parse(result.value);
    } catch (err) {
        console.error('getPublicKeyJwk error:', err);
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