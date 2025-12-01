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

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Mobile Development** | React (Javascript) | To simplify prototype development and leverage the native compatibility of EBSI CLI with Node.js. |
| **Web Wrapper** | Capacitor | To enable mobile application distribution. |
| **Blockchain/Identity** | EBSI (European Blockchain Services Infrastructure) | Used as the anchor for SSI public keys and credential verification. |
| **Libraries/Standards** | EBSI Libraries, eIDAS 2.0, European Learning Model, BBS Signature Scheme. | Implementation of EU standards for digital identity and privacy. |