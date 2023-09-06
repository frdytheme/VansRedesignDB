const express = require("express");
const Product = require("../../models/Product");
const router = express.Router();
const getId = require("../../middleware/getId");

router.get("/", async (req, res) => {
  const {
    page = 1,
    pageSize = 25,
    id,
    name,
    color,
    price,
    model,
    category,
    size,
    all,
    mainCategory,
  } = req.query;
  const skipCount = (page - 1) * pageSize;
  const query = {};

  if (id) query.id = id;
  if (name) query.name = { $regex: name };
  if (color) query.color = { $in: color.split(",") };
  if (price) {
    const priceArr = price.split(",");
    let minPrice = parseInt(priceArr[0], 10);
    let maxPrice = parseInt(priceArr[1], 10);
    query.price = { $gte: minPrice, $lte: maxPrice };
  }
  if (model) query.model = { $in: model.split(",") };
  if (category) {
    const categoryArr = category.split(",");
    query.category = { $in: categoryArr.map((item) => new RegExp(item, "i")) };
  }
  if (size) {
    const sizeArr = size.split(",");
    query.$or = sizeArr.map((size) => ({
      [`size.${size}`]: { $gte: 1 },
    }));
  }
  /*
    size 필드 조회 :
    객체 필드를 조회하며 전달받은 텍스트를 키로 가진 요소 중 값(수량)이 1 이상을 만족하면 반환.
    $or 연산자를 사용해서 하나의 조건이라도 만족하면 반환.
  */
  if (mainCategory) {
    query.mainCategory = { $all: mainCategory.split(",") };
  }

  try {
    const productCount = await Product.countDocuments(query);
    const products = all
      ? await Product.find(query)
      : await Product.find(query).skip(skipCount).limit(Number(pageSize));
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
    return res
      .status(400)
      .json({ errors: [{ msg: "Product already exists" }] });
  }
  const product = new Product({
    id: req.body.id,
    model: req.body.model,
    name: req.body.name,
    mainCategory: req.body.mainCategory,
    category: req.body.category,
    price: req.body.price,
    color: req.body.color,
    size: req.body.size,
  });
  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 사이즈 수량 1~10 랜덤 업데이트.
router.post("/update-data", async (req, res) => {
  const { name, model } = req.query;
  try {
    const products = await Product.find();

    for (const product of products) {
      const { model, size } = product;
      for (const key in size) {
        size[key] = Math.trunc(Math.random() * 10 + 1);
      }
      await Product.updateOne({ model: model }, { $set: { size: size } });
    }

    res.status(200).json({ total: products.length, product: products });
  } catch (err) {
    res.status(401).send("서버 오류, 업데이트 실패");
  }
});

router.post("/update-date", async (req, res) => {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 40);
  try {
    const products = await Product.find({
      date: { $gt: oneDayAgo },
      mainCategory: { $regex: "CLOTHES" },
    });
    for (const item of products) {
      item.mainCategory.push("NEW");
      await item.save();
    }
    res.json({
      total: products.length,
      products: products,
    });
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
