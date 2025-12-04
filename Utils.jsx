import { util } from "@cef-ebsi/key-did-resolver";
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import { ES256Signer } from "did-jwt";
import { createVerifiableCredentialJwt } from "@cef-ebsi/verifiable-credential";

import { generateMnemonic, mnemonicToSeed, } from 'bip39';
import { HDKey } from '@scure/bip32';
import { createECDH } from 'node:crypto';

const PRIVATE_KEY_ID = import.meta.env.VITE_PRIVATE_KEY_ID || 'walletPrivateKey';
const PUBLIC_KEY_ID = import.meta.env.VITE_PUBLIC_KEY_ID || 'walletPublicKey';
const DID_KEY_ID = import.meta.env.VITE_DID_KEY_ID || 'walletDid';

const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || 'test';
const HOST = import.meta.env.VITE_HOST || 'api-test.ebsi.eu';

export async function generateDid() {
    try {

        const mnemonic = generateMnemonic(128);
        
        // transform the mnemonic into a private and public JWK key pair with EC P-256 curve
        const seed = await mnemonicToSeed(mnemonic);
        const hdKey = HDKey.fromMasterSeed(seed);

        const derivedKey = hdKey.derive("m/0'/0'/0'");
        const privateKeyBuffer = derivedKey.privateKey;
        
        if (!privateKeyBuffer) {
            throw new Error('Failed to derive private key from mnemonic');
        }
        
        const keyObject = createECDH('P-256');
        keyObject.from(privateKeyBuffer);

        // 3. Esportazione in formato PKCS#8 (PEM) per essere compreso da jose
        // Questo passaggio garantisce che tutte le proprietà (come la curva) siano incluse.
        const privateKeyPem = keyObject.export({ type: 'pkcs8', format: 'pem' });
        
        // 4. Importazione in 'jose' per ottenere l'oggetto KeyLike
        const keyLike = await importJWK(
            { key: privateKeyPem, alg: 'ES256', crv: 'P-256' }, // La chiave PEM nel campo 'key'
            'ES256' // Algoritmo per la chiave
        );

        // 5. Esportazione in formato JWK
        const privateJwk = await exportJWK(keyLike);
        
        // Otteniamo la JWK Pubblica (per la verifica)
        const publicKeyLike = keyLike.publicKey;
        const publicJwk = await exportJWK(publicKeyLike);

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

export async function generateDidLegacy() {
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

        console.log('Generated and stored DID and keys:', { did, privateJwk, publicJwk });

        // Return useful objects for immediate use
        return did;
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