require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const connectMongo = require('./config/mongo');
const mqttService = require('./services/mqttService');
const sensorSimulator = require('./services/sensorSimulator');

const authRoutes = require('./routes/authRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const controlRoutes = require('./routes/controlRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const historyRoutes = require('./routes/historyRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_ORIGIN || '*' } });

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'waterwise-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/control', controlRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/settings', settingsRoutes);

io.on('connection', (socket) => {
  socket.emit('system', { message: 'Connected to WaterWise live stream' });
});

sensorSimulator.start((payload) => {
  io.emit('sensor:update', payload);
  mqttService.publish('waterwise/sensors/live', payload);
});

(async () => {
  await connectMongo();
  mqttService.connect();
  const port = process.env.PORT || 8080;
  server.listen(port, () => console.log(`WaterWise backend listening on ${port}`));
})();
