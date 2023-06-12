const express = require("express");
const Product = require("../../models/Product");
const router = express.Router();
const data = require("../../db/product");
const mongoose = require("mongoose");

router.post("/", async (req, res) => {
  try {
    for (const item of data) {
      const model = await Product.findOne({ model: item.model });
      if (model) {
        return res.status(400).json({ errors: [{ msg: "Product already exists" }] });
      }
      const newItem = new Product(item);
      await newItem.save();
    }
    mongoose.connection.close();
    res.status(200).json({ msg: "데이터 전송이 완료되었습니다." });
  } catch (error) {
    console.error(`Failed to save items: ${err}`);
  }
});

module.exports = router;
