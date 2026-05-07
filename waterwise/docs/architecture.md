# WaterWise Architecture

## Mobile
- MVVM + Repository pattern
- Retrofit for REST, MQTT for commands/state, Room for offline cache
- Navigation Component based screen flow
- LiveData stream from simulation + network

## Backend
- Express modular APIs
- JWT auth middleware
- MongoDB collections: users, sensor_data, notifications, irrigation_logs
- Socket.IO for live pushes
- MQTT bridge for IoT topics

## Web Dashboard
- React + Recharts
- Socket stream consuming same live data channel

## IoT
- ESP32 publishes sensor JSON every 2-3s
- Subscribes to pump/valve control topics
- Fault detector emits leak/failure alerts
