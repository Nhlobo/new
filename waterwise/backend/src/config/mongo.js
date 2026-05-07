const mongoose = require('mongoose');

module.exports = async function connectMongo() {
  const uri = process.env.MONGO_URI;
  await mongoose.connect(uri);
  console.log('MongoDB connected');
};
