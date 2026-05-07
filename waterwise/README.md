# WaterWise — Smart Irrigation Demo Suite

WaterWise is a hackathon-ready end-to-end smart irrigation platform with a native Android app, Node backend, React admin dashboard, and ESP32 architecture.

## Repository Structure
- `mobile-app/` Native Android app (Java/XML, MVVM, Room, Retrofit, MQTT)
- `backend/` Express + MongoDB + JWT + MQTT + WebSocket live stream
- `web-dashboard/` React analytics and farm operations dashboard
- `esp32-firmware/` ESP32 simulation architecture for telemetry and control
- `docs/` setup, deployment, API references

## Quick Start
### Backend
```bash
cd backend
npm install
npm run dev
```

### Web Dashboard
```bash
cd web-dashboard
npm install
npm run dev
```

## API Summary
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/sensors`
- `POST /api/pump`
- `GET /api/notifications`
- `GET /api/history`
- `GET /api/settings`

## Deployment Notes
- Render-ready backend with environment variables
- MongoDB Atlas URI support
- MQTT broker endpoint configurable
