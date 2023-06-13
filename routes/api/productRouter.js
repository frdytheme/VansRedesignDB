const express = require("express");
const Product = require("../../models/Product");
const router = express.Router();
const data = require("../../db/product");
const mongoose = require("mongoose");
const getId = require("../../middleware/getId");

router.get("/", async (req, res) => {
  const { searchId, searchModel } = req.query;
  try {
    let product;
    if (searchId) {
      product = await Product.find({ id: searchId });
    } else if(searchModel) {
      product = await Product.find({ model: searchModel });
    } else {
      product = await Product.find();
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.post("/", async (req, res) => {
  const model = await Product.findOne({ model: req.body.model });
  if (model) {
    return res.status(400).json({ errors: [{ msg: "Product already exists" }] });
  }
  const product = new Product({
    id: req.body.id,
    model: req.body.model,
    name: req.body.name,
    category: req.body.category,
    price: req.body.price,
    color: req.body.color,
  });
  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
    // for (const item of data) {
    //   const model = await Product.findOne({ model: item.model });
    //   if (model) {
    //     return res.status(400).json({ errors: [{ msg: "Product already exists" }] });
    //   }
    //   const newItem = new Product(item);
    //   await newItem.save();
    // }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:id", getId, async (req, res) => {
  if (req.body.category != null) {
    res.product.category = req.body.category;
  }
  if (req.body.name != null) {
    res.product.name = req.body.name;
  }
  try {
    const updateProduct = await res.product.save();
    res.json(updateProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", getId, async (req, res) => {
  try {
    await res.product.deleteOne();
    res.json({ message: `${res.product.name}정보가 DB에서 삭제됐습니다.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
