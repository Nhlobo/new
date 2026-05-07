# API Documentation

## Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

## Sensors
- `GET /api/sensors/latest`
- `GET /api/sensors/history?limit=50`

## Control
- `POST /api/control/pump` `{ "action": "start|stop|emergency_stop" }`

## Notifications
- `GET /api/notifications`

## History
- `GET /api/history/irrigation`

## Settings
- `GET /api/settings`
- `PUT /api/settings`
