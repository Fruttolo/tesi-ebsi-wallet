# 🛡️ EU Digital Identity Wallet Open-Source Prototype (EUDI-WOP)

## Introduction

This repository contains the Bachelor's thesis prototype developed within the Computer Engineering program at the University of Padua.

The project aims to explore and implement the key concepts of the **EU Digital Identity Wallet (EUDI Wallet)** and **Self-Sovereign Identity (SSI)**, focusing on interoperability, security, and privacy protection.

The prototype demonstrates a fully open-source wallet, with particular emphasis on the secure management of Verifiable Credentials (VCs), in alignment with eIDAS 2.0 standards.

## 🎯 Project Objectives

The primary goal of the project is to create an Android wallet prototype capable of:

1.  **Interacting with EBSI:** Establishing communication with the **European Blockchain Services Infrastructure (EBSI)** blockchain for validation and verification of information.
2.  **Ensuring Privacy:** Implementing **Selective Disclosure** mechanisms, allowing the user to share only the strictly necessary information (e.g., age verification) without revealing sensitive personal data.
3.  **VC Management:** Creating a structure for storing and managing Verifiable Credentials (VCs), such as academic and professional credentials.
4.  **Security and Backup:** Implementing a completely offline wallet backup system using a **Seed Phrase** (e.g., BIP39 standard).

## ⚙️ Proposed Technology Stack

| Component               | Technology                                                                | Rationale                                                                                         |
| :---------------------- | :------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------ |
| **Mobile Development**  | React (Javascript)                                                        | To simplify prototype development and leverage the native compatibility of EBSI CLI with Node.js. |
| **Web Wrapper**         | Capacitor                                                                 | To enable mobile application distribution.                                                        |
| **Blockchain/Identity** | EBSI (European Blockchain Services Infrastructure)                        | Used as the anchor for SSI public keys and credential verification.                               |
| **Libraries/Standards** | EBSI Libraries, eIDAS 2.0, European Learning Model, BBS Signature Scheme. | Implementation of EU standards for digital identity and privacy.                                  |

## ✨ Implemented Features

### Core Functionality

- ✅ **DID Management**: Generation and management of Decentralized Identifiers (DID)
- ✅ **Seed Phrase Backup**: BIP39-compliant backup and recovery system
- ✅ **Secure Storage**: Encrypted local storage for sensitive data
- ✅ **QR Code Scanner**: Native camera integration for verification requests
- ✅ **Credential Management**: Storage and display of Verifiable Credentials

### Identity Verification

- ✅ **QR-based Verification**: Scan QR codes for identity verification requests
- ✅ **Verification Flow**: Complete challenge-response protocol implementation
- ✅ **User Consent**: Explicit approval required before sharing data
- 🔄 **Selective Disclosure**: Privacy-preserving attribute sharing (in progress)
- 🔄 **Age Verification**: Zero-knowledge proof of age without revealing birthdate (in progress)

### User Interface

- ✅ **Mobile-First Design**: Optimized for Android devices
- ✅ **Material Design**: Clean and modern UI with Material-UI components
- ✅ **Dark Theme**: Eye-friendly dark mode
- ✅ **Responsive Layout**: Adapts to different screen sizes
- ✅ **Touch Optimized**: 44px minimum touch targets (WCAG compliant)

### Security Features

- ✅ **Encrypted Storage**: AES-256-GCM encryption for sensitive data
- ✅ **Permission Management**: Runtime camera permissions
- ✅ **Input Validation**: Secure parsing of QR code data
- ✅ **HTTPS Only**: Secure communication with external services
- 🔄 **Certificate Pinning**: (planned)
- 🔄 **Root Detection**: (planned)

## 📱 Quick Start

### Prerequisites

```bash
Node.js v18+
pnpm (or npm/yarn)
Android Studio (for Android build)
```

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/tesi-ebsi-wallet.git
cd tesi-ebsi-wallet

# Install dependencies
pnpm install

# Sync Capacitor
pnpm cap:sync

# Run on Android
pnpm run:android
```

### Development

```bash
# Start dev server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

## 📖 Documentation

- [Implementation Plan](./docs/PIANO_IMPLEMENTAZIONE.md) - Detailed development roadmap
- [QR Scanner Guide](./docs/QR_SCANNER_GUIDE.md) - QR scanning functionality documentation
- [Architecture](./docs/ARCHITECTURE.md) - System architecture overview
- [Security Analysis](./docs/SECURITY_SCAN_REPORT.md) - Security considerations and mitigations

## 🔐 Security

This project follows security best practices:

- Regular security scans with Snyk
- No hardcoded secrets
- Secure key management
- Privacy by design

See [SECURITY_SCAN_REPORT.md](./docs/SECURITY_SCAN_REPORT.md) for details.

## 📄 License

This project is part of a university thesis and is available for educational purposes.

## 👨‍💻 Author

Developed as part of a Bachelor's thesis in Computer Engineering at the University of Padua.

---

**Status**: 🚧 In Active Development  
**Last Updated**: January 26, 2026
| **Libraries/Standards** | EBSI Libraries, eIDAS 2.0, European Learning Model, BBS Signature Scheme. | Implementation of EU standards for digital identity and privacy. |
