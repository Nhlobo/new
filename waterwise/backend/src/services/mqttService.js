const mqtt = require('mqtt');
let client;

exports.connect = () => {
  client = mqtt.connect(process.env.MQTT_URL);
  client.on('connect', () => console.log('MQTT connected'));
};

exports.publish = (topic, payload) => {
  if (client?.connected) client.publish(topic, JSON.stringify(payload));
};
