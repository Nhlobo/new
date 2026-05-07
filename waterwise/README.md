# WaterWise 🌱💧

WaterWise is a full-stack smart irrigation demo platform designed for hackathons and startup-style demos. It includes:

- **Native Android app (Java + XML + Material 3)**
- **Node.js backend (Express + MongoDB + JWT + MQTT + WebSocket)**
- **React web admin dashboard**
- **ESP32 firmware architecture simulation**

## Monorepo Structure

```
waterwise/
├── mobile-app/
├── backend/
├── web-dashboard/
├── esp32-firmware/
├── docs/
├── assets/
└── README.md
```

## Quick Start

### 1) Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 2) Web Dashboard
```bash
cd web-dashboard
npm install
npm run dev
```

### 3) Android App
Open `mobile-app/` in Android Studio (Giraffe+), sync Gradle, and run.

## Demo Features
- Live sensor simulation (moisture, tank, flow, temperature, battery)
- Pump/valve control with MQTT topic architecture
- Rain/leak/fault simulation + alerts
- Room offline cache and sync strategy
- Analytics and history visualization
- Role-ready architecture for multi-farm scale

## Deployment
- Backend: Render-ready (`backend/render.yaml`)
- Database: MongoDB Atlas
- MQTT: Public or self-hosted broker

See `docs/` for full setup and API docs.
