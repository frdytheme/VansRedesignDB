const express = require("express");
const Product = require("../../models/Product");
const router = express.Router();
const getId = require("../../middleware/getId");

router.get("/", async (req, res) => {
  const { page = 1, pageSize = 25, id, name, color, price, model, category } = req.query;
  const skipCount = (page - 1) * pageSize;
  const query = {};

  if (id) query.id = id;
  if (name) query.name = name;
  if (color) query.color = { $in: color.split(",") };
  if (price) {
    const priceArr = price.split(",");
    let minPrice = parseInt(priceArr[0], 10);
    let maxPrice = parseInt(priceArr[1], 10);
    query.price = { $gte: minPrice, $lte: maxPrice };
  }
  if (model) query.model = { $in: model.split(",") };
  if (category) query.category = { $in: category.split(",") };
  try {
    const productCount = await Product.countDocuments(query);
    const products = await Product.find(query).skip(skipCount).limit(Number(pageSize));
    res.json({
      total: productCount,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(productCount / Number(pageSize)),
      products: products,
    });
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/update-date", async (req, res) => {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 7);
  try {
    const products = await Product.find();
    for (const item of products) {
      item.date = oneDayAgo;
      await item.save();
    }
    res.status(200).json({ msg: "Update Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    res.end();
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
