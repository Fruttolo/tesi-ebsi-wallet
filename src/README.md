# Source Code - EBSI Wallet

Questa directory contiene tutto il codice sorgente dell'applicazione EBSI Wallet, organizzato secondo principi di architettura modulare pulita.

## 📂 Organizzazione Directory

\`\`\`
src/
├── crypto/ → Cryptography & Key Management
├── identity/ → DID Management & Resolution  
├── storage/ → Secure Data Persistence
├── utils/ → Utilities & Validation
├── components/ → Reusable UI Components
├── pages/ → Application Pages/Routes
├── tests/ → Test Suites
├── styles/ → Global Styles & Animations
└── theme/ → Material-UI Theme Configuration
\`\`\`

## 🔐 crypto/

**Gestione chiavi crittografiche e seed phrase**

| File                 | Responsabilità                              |
| -------------------- | ------------------------------------------- |
| \`seedManager.js\`   | Generazione e validazione seed phrase BIP39 |
| \`keyDerivation.js\` | Derivazione chiavi BIP32 e creazione JWK    |

**Dipendenze**: @scure/bip39, @scure/bip32, @noble/curves, @noble/hashes

## 🆔 identity/

**Gestione identità decentralizzata (DID)**

| File               | Responsabilità                   |
| ------------------ | -------------------------------- |
| \`didManager.js\`  | Generazione DID e DID Documents  |
| \`didResolver.js\` | Risoluzione DID da EBSI registry |

**Dipendenze**: @cef-ebsi/key-did-resolver, bs58

## 💾 storage/

**Persistenza sicura e encryption**

| File                     | Responsabilità                  |
| ------------------------ | ------------------------------- |
| \`encryptionManager.js\` | Encryption/Decryption AES-GCM   |
| \`secureStorage.js\`     | Wrapper SecureStoragePlugin     |
| \`didStorage.js\`        | Storage DID, chiavi e documenti |

**Dipendenze**: capacitor-secure-storage-plugin, @capacitor/preferences

## 🛠️ utils/

**Funzioni di utilità**

| File              | Responsabilità                               |
| ----------------- | -------------------------------------------- |
| \`validation.js\` | Validazione input (seed, DID, password, JWK) |
| \`Utils.jsx\`     | ⚠️ Legacy - In fase di migrazione            |

## 🎨 components/

**Componenti UI riusabili**

| File                    | Descrizione                          |
| ----------------------- | ------------------------------------ |
| `PageBase.jsx`          | Layout base per pagine               |
| `SeedPhraseDisplay.jsx` | Display sicuro seed phrase           |
| `LoadingState.jsx`      | Stato di caricamento con spinner     |
| `SkeletonLoader.jsx`    | Skeleton loader per liste            |
| `ErrorState.jsx`        | Visualizzazione errori user-friendly |
| `SuccessSnackbar.jsx`   | Notifiche di successo                |
| `AttributeSelector.jsx` | Selector attributi credenziali       |

## 📄 pages/

**Pagine applicazione**

| File                        | Rotta                     | Descrizione                 |
| --------------------------- | ------------------------- | --------------------------- |
| `Home.jsx`                  | `/`                       | Homepage wallet             |
| `WalletSetup.jsx`           | `/wallet-setup`           | Wizard creazione wallet     |
| `ImportWallet.jsx`          | `/import-wallet`          | Import wallet esistente     |
| `Onboarding.jsx`            | `/onboarding`             | Tutorial primo utilizzo     |
| `SeedPhraseTutorial.jsx`    | N/A (Dialog)              | Guida seed phrase sicura    |
| `CredentialsList.jsx`       | `/credentials`            | Lista credenziali           |
| `SelectivePresentation.jsx` | `/selective-presentation` | Presentazione selettiva     |
| `VerificationRequest.jsx`   | `/verification-request`   | Gestione richieste verifica |
| `FirstSetup.jsx`            | `/first-setup`            | ⚠️ Deprecato - Da rimuovere |

## 🧪 tests/

**Test suite**

| File                     | Coverage                 |
| ------------------------ | ------------------------ |
| \`crypto.test.js\`       | 15 test - Crypto modules |
| \`dependencies.test.js\` | 10 test - Dependencies   |
| \`setup.js\`             | Test configuration       |

Run tests: \`pnpm test\`

## 🚀 Quick Start Guide

### Creare un nuovo wallet

\`\`\`javascript
import { generateMnemonic, mnemonicToSeed } from './crypto/seedManager.js';
import { derivePrivateKey, createJWK } from './crypto/keyDerivation.js';
import { generateDID } from './identity/didManager.js';
import { saveDID, saveKeys } from './storage/didStorage.js';

async function createWallet() {
// 1. Genera seed phrase
const mnemonic = generateMnemonic(128); // 12 parole

// 2. Deriva seed
const seed = await mnemonicToSeed(mnemonic);

// 3. Deriva chiavi
const privateKey = derivePrivateKey(seed);
const { privateJwk, publicJwk } = createJWK(privateKey);

// 4. Genera DID
const did = generateDID(publicJwk);

// 5. Salva
await saveDID(did);
await saveKeys(privateJwk, publicJwk);

return { mnemonic, did };
}
\`\`\`

### Importare wallet esistente

\`\`\`javascript
import { validateMnemonic, mnemonicToSeed } from './crypto/seedManager.js';

async function importWallet(mnemonic) {
if (!validateMnemonic(mnemonic)) {
throw new Error('Invalid seed phrase');
}

// Stesso processo di createWallet...
}
\`\`\`

### Recuperare DID salvato

\`\`\`javascript
import { getDID, getPublicKey } from './storage/didStorage.js';

async function getWalletInfo() {
const did = await getDID();
const publicJwk = await getPublicKey();
return { did, publicJwk };
}
\`\`\`

### Risolvere un DID

\`\`\`javascript
import { resolveDID } from './identity/didResolver.js';

async function resolveRemoteDID(did) {
const didDocument = await resolveDID(did, 'pilot');
return didDocument;
}
\`\`\`

## 🔒 Security Best Practices

### ✅ DO

\`\`\`javascript
import { secureWipe } from './crypto/seedManager.js';

async function handleSensitiveData() {
const seed = await mnemonicToSeed(mnemonic);
try {
// ... usa seed
} finally {
secureWipe(seed); // Cleanup!
}
}
\`\`\`

### ❌ DON'T

\`\`\`javascript
// ❌ MAI esporre chiavi private in log
console.log('Private key:', privateKey);

// ❌ MAI salvare seed in chiaro
localStorage.setItem('mnemonic', mnemonic);

// ❌ MAI dimenticare il cleanup
const seed = await mnemonicToSeed(mnemonic);
// ... codice senza finally
\`\`\`

## 📚 Documentation

- **Architecture**: [/docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- **Migration Guide**: [/docs/MIGRATION_GUIDE.md](../docs/MIGRATION_GUIDE.md)
- **Refactoring Notes**: [/docs/REFACTORING_FASE2_COMPLETED.md](../docs/REFACTORING_FASE2_COMPLETED.md)
- **FASE 2 Specs**: [/docs/fasi/FASE_02_Identita_DID.md](../docs/fasi/FASE_02_Identita_DID.md)

## 🧪 Testing

\`\`\`bash

# Run all tests

pnpm test:run

# Run with coverage

pnpm test:coverage

# Watch mode

pnpm test

# Specific test file

pnpm test:run src/tests/crypto.test.js
\`\`\`

## 🔍 Code Quality

\`\`\`bash

# Lint

pnpm lint

# Format

pnpm format

# Security scan

pnpm security:scan
\`\`\`

## 📦 Key Dependencies

| Package                         | Usage                     |
| ------------------------------- | ------------------------- |
| @scure/bip39                    | BIP39 mnemonic generation |
| @scure/bip32                    | BIP32 key derivation      |
| @noble/curves                   | P-256 elliptic curve      |
| @noble/hashes                   | Cryptographic hashing     |
| @cef-ebsi/key-did-resolver      | EBSI DID resolution       |
| capacitor-secure-storage-plugin | Secure storage            |
| @capacitor/preferences          | Preferences storage       |

## 🤝 Contributing

Prima di committare:

1. Esegui i test: \`pnpm test:run\`
2. Esegui il linter: \`pnpm lint\`
3. Formatta il codice: \`pnpm format\`
4. Verifica sicurezza: Snyk scan automatico

## 📝 Code Style

- **Moduli ES6**: Usa \`import/export\`
- **JSDoc**: Documenta tutte le funzioni pubbliche
- **Error Handling**: Sempre con try/catch/finally
- **Naming**: camelCase per funzioni, PascalCase per componenti
- **File Extension**: \`.js\` per moduli, \`.jsx\` per componenti React

## 🐛 Debugging

\`\`\`javascript
// Abilita debug mode (vite.config.js)
// Poi:
import { sanitizeError } from './utils/validation.js';

try {
// ... codice
} catch (error) {
console.error('Debug:', sanitizeError(error));
}
\`\`\`

---

_Per maggiori informazioni, consulta la documentazione in /docs/_
