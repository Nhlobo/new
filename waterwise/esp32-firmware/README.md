# ESP32 Firmware Architecture (Simulation)

## Topics
- Publish: `waterwise/sensors/live`
- Subscribe: `waterwise/control/pump`, `waterwise/control/valve`
- Publish alerts: `waterwise/alerts`

## Modules
- SensorManager: reads moisture/tank/flow/temp
- IrrigationController: controls relay pump + solenoid
- ConnectivityManager: Wi-Fi reconnect + offline queue
- FaultMonitor: detects leaks, dry-run pump, sensor disconnects

## Loop Flow
1. Read sensors
2. Run safety checks
3. Apply automation rules
4. Publish telemetry JSON
5. Execute incoming commands
