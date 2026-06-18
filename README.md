# 🏦 Bank Management System (Node.js)

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/License-MIT-blue)
![Status](https://img.shields.io/badge/Status-In%20Development-yellow)
![Version](https://img.shields.io/badge/Version-2.0.0-orange)

A backend-style banking system built with Node.js that simulates real-world banking operations, including authentication, transactions, and business rule enforcement.

---

## 📌 Project Overview

This project is built in progressive versions to simulate real software development lifecycle:

- **Version 1** → Core banking system
- **Version 2** → Security & authentication layer
- **Version 3** → Advanced backend architecture (planned)

---

# 🧱 Version 1.0.0 (Completed)

## Features

### 👤 Account Management
- Create user accounts
- Create bank accounts (Savings / Current)
- Account status system (Active / Deactivated)

### 💰 Core Banking Operations
- Deposit funds
- Withdraw funds
- Check balance
- View transaction history

### 📊 Business Rules
- Savings account withdrawal limits
- Input validation (regex-based)
- Block transactions on inactive accounts

### 💾 Data Storage
- JSON file-based persistence

---

# 🔐 Version 2.0.0 (In Progress)

## 🔑 Security Features
- PIN authentication for withdrawals & transfers
- PIN hashing using bcrypt
- 4-digit PIN validation

## 🚨 Account Protection
- Track failed PIN attempts
- Lock account after 3 failed attempts
- Block all transactions on locked accounts

## 🔄 Transaction System Upgrade
- Transfer system (in development)
- PIN required for transfers
- Improved validation logic

## 🧾 Transaction Tracking
- Unique transaction IDs (in progress)
- Improved transaction history logging

---

# 🚀 Version 3.0.0 (Planned)

## 🎯 Goal
Upgrade system into a backend-level banking simulation with real-world architecture.

---

## 🔐 PIN Management System
- Change PIN
- Reset PIN
- Secure PIN update workflow

---

## 🧾 Advanced Transaction System
- Full transaction model:
  - transactionId
  - type (deposit, withdraw, transfer_in, transfer_out)
  - status (success / failed / pending)
  - timestamp
  - description
- Audit-ready transaction logs

---

## 📊 Account Statements
- View transaction history
- Filter by date, type, and amount
- Export statements (JSON/text)

---

## 🔁 Transfer System Upgrade
- Full transfer completion between accounts
- Optional transfer fees
- Strong consistency validation

---

## 🛡️ Security Enhancements
- Auto account unlock timer (optional)
- Suspicious activity detection
- Admin unlock system

---

## 💰 Balance Rules Upgrade
- Minimum balance enforcement
- Overdraft rules (optional feature)

---

## 🏗️ Architecture Refactor
- Modular structure:
  - services/
  - controllers/
  - models/
  - utils/
- Clean separation of logic

---

## 🧪 Testing
- Manual test scripts for:
  - PIN validation
  - transfers
  - withdrawals
  - account lock behavior

---

## 📌 Final Vision

A simplified backend banking API simulation with:
- Authentication
- Secure transactions
- Modular architecture
- Real-world banking rules

---

## 📜 License
MIT License