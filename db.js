const mongoose = require('mongoose');
const connection = require('./connection.json');

const uri = connection.mongoURL;

const connectDB = async() => {
  try{
    await mongoose.connect(uri, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });

    console.log('MongoDB Connected...')
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = connectDB;