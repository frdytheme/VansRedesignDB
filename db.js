const mongoose = require('mongoose');
const connection = require('./connection.json');

const uri = connection.mongoURL;

const connectDB = async() => {
  try{
    await mongoose.connect(uri, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });

    /*
    필드 타입 변경 로직 -----------------------------------------

    await client.connect();

    const database = client.db('test');
    const collection = database.collection('products');

    // 데이터베이스의 기존 데이터를 읽어옴
    const documents = await collection.find().toArray();

    // 데이터 변환 후 업데이트
    for (const document of documents) {
      const newPrice = parseFloat(document.price);
      document.price = newPrice;
      await collection.updateOne({ _id: document._id }, { $set: document });
    }

    console.log('Field types updated successfully!');

    필드 타입 변경 로직 -----------------------------------------
    */

    console.log('MongoDB Connected...')
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = connectDB;