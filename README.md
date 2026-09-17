# 🛡️ ScamShield — AI Fraud Copilot for Families

> **Protect non-tech-savvy parents and family members from financial fraud, WhatsApp scams, fake utility bills, and phishing traps in real-time.**

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-3D_Radar-black?logo=three.js&logoColor=white)](https://threejs.org/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini_2.5_Flash-8E75B2?logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Problem & Mission

Every day, non-tech-savvy elderly parents and family members are targeted by sophisticated scams:
* Fake electricity cutoff notices threatening rapid blackout.
* Fraudulent Income Tax refund portals harvesting bank accounts.
* Bank account / KYC expiration traps soliciting NetBanking OTPs.
* Family impersonation emergencies ("Grandma, lost my phone, send cash").

**ScamShield** acts as a shared, guardian AI copilot. Family members can forward any suspicious WhatsApp text, link, or screenshot to receive instant, plain-language risk breakdowns and 1-click protection alerts.

---

## ✨ Key Features

### 🔍 1. Real-Time Fraud Analysis
* Powered by **Gemini 2.5 Flash** with multimodal support (analyzes both message text and screenshot attachments).
* Includes an intelligent client/server **heuristic fallback engine** that operates even without an API key.
* Generates clear urgency scores (0–100), threat classification, and plain-language explanation bullets that any grandparent can understand.

### 🌐 2. Interactive 3D Threat Radar
* Powered by **Three.js WebGL**.
* Visualizes regional scam clusters on a 3D cyber globe.
* Features pulsing incident pins, cross-family attack vectors, dynamic raycasting, and full touch-drag rotation for mobile devices.

### 👴 3. Elder Mode
* One-click toggle designed specifically for elderly eyes.
* Increases contrast, expands font hierarchy, and simplifies controls to eliminate tech intimidation.

### 📢 4. 1-Click Family Defense Broadcast
* When a high-risk scam is detected, broadcast an emergency advisory across all connected family WhatsApp contacts to prevent siblings and spouses from falling for the same pitch.
* *Note: The emergency broadcast endpoint is simulated in the current build for demonstration purposes. Full production deployment requires integrating the WhatsApp Business API or Twilio Outbound Messaging API along with a recipient opt-in consent flow.*

### 📱 5. Progressive Web App (PWA)
* Standalone display mode with offline shell caching.
* Installable directly to mobile home screens on Android and iOS.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas Confetti, Motion |
| **3D Graphics** | Three.js (WebGL interactive globe & defensive shield) |
| **Backend** | Node.js, Express, `@google/genai` (Gemini 2.5 Flash) |
| **Tooling & Build** | Vite 6, tsx, esbuild |

---

## 🚀 Quick Start

### 1. Prerequisites
* **Node.js** (v18 or newer)
* **npm** or **bun**

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ScamShield.git
cd ScamShield

# Install dependencies
npm install
# or: bun install
```

### 3. Environment Setup (Optional)
Create a `.env` file in the root directory (or copy from `.env.example`):
```env
# Optional: Provide your Gemini API Key for deep AI fraud evaluation.
# If omitted, ScamShield automatically runs its built-in heuristic fraud engine.
GEMINI_API_KEY="your_api_key_here"

# Server Port (defaults to 3000)
PORT=3000
```

### 4. Run Development Server
```bash
npm run dev
# or: bun run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📦 Production Build

```bash
# Compile client bundle and bundle server
npm run build

# Start production server
npm start
```

---

## 📂 Project Structure

```
ScamShield/
├── public/
│   ├── icon.svg               # Vector brand shield logo & PWA icon
│   └── manifest.json          # PWA web app manifest
├── src/
│   ├── components/
│   │   ├── Navbar.tsx         # Top navigation & elder mode toggle
│   │   ├── Sidebar.tsx        # Navigation menu & live demo triggers
│   │   ├── ThreeRiskMap.tsx   # 3D interactive Threat Radar globe (Three.js)
│   │   ├── ThreeShield.tsx    # 3D holographic status shield
│   │   ├── RiskScoreGauge.tsx # Animated SVG threat level gauge
│   │   ├── QuickForwardModal.tsx # WhatsApp simulation forward modal
│   │   ├── InviteModal.tsx    # Family circle invite generator
│   │   └── PWAInstallButton.tsx # Native PWA installation prompt
│   ├── pages/
│   │   ├── LandingPage.tsx    # Showcase and feature walkthrough
│   │   ├── DashboardPage.tsx  # Central overview & radar monitor
│   │   ├── MessageDetailPage.tsx # Plain-language AI breakdown & advice
│   │   ├── MessagesPage.tsx   # Searchable incident archive & filters
│   │   ├── AlertsPage.tsx     # Priority notification center
│   │   ├── FamilyPage.tsx     # Family circle management & permissions
│   │   ├── SettingsPage.tsx   # Privacy, retention, and notification toggles
│   │   └── AuthPage.tsx       # Circle onboarding setup wizard
│   ├── mock/
│   │   └── data.ts            # Realistic demonstration datasets
│   ├── types.ts               # Core TypeScript data contracts
│   ├── App.tsx                # Central state container & router
│   ├── index.css              # Tailwind CSS v4 & custom glassmorphism styles
│   └── main.tsx               # Client entry point
├── server.ts                  # Express backend + Gemini API + Vite SSR
├── vite.config.ts             # Vite configuration with Tailwind CSS v4
├── tsconfig.json              # TypeScript configuration
└── package.json               # Project manifest
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
