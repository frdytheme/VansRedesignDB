const express = require("express");
const Product = require("../../models/Product");
const router = express.Router();
const getId = require("../../middleware/getId");

router.get("/", async (req, res) => {
  const { page = 1, pageSize = 25, id, name, color, price, model, category, size, all, mainCategory } = req.query;
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
    query.mainCategory = { $all: mainCategory.split(",")};
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
    return res.status(400).json({ errors: [{ msg: "Product already exists" }] });
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

router.post("/update-data", async (req, res) => {
  const { name, mainCategory, category } = req.query;
  const query = {};
  if (name) query.name = { $regex: name };
  if (category) query.category = { $regex: category };
  try {
    const products = await Product.find(query);
    for (const item of products) {
      item.mainCategory = [...item.mainCategory, item.category];
      await item.save();
    }
    res.json({
      total: products.length,
      products: products,
    });
  } catch (err) {
    console.error(err);
  } finally {
    res.end();
  }
});

router.post("/update-date", async (req, res) => {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 40);
  try {
    const products = await Product.find({ date: { $gt: oneDayAgo }, mainCategory: { $regex: "CLOTHES" } });
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

// router.post("/update-size", async (req, res) => {
//   const shoesSize = {
//     210: 1,
//     215: 1,
//     220: 1,
//     225: 1,
//     230: 1,
//     235: 1,
//     240: 1,
//     245: 1,
//     250: 1,
//     255: 1,
//     260: 1,
//     265: 1,
//     270: 1,
//     275: 1,
//     280: 1,
//     285: 1,
//     290: 1,
//     295: 1,
//     300: 1,
//     310: 1,
//   };
//   const clothSize = {
//     XS: 1,
//     S: 1,
//     M: 1,
//     L: 1,
//     XL: 1,
//     XXL: 1,
//   };
//   const bottomSize = {
//     25: 1,
//     26: 1,
//     27: 1,
//     28: 1,
//     29: 1,
//     30: 1,
//     31: 1,
//     32: 1,
//     33: 1,
//     34: 1,
//     36: 1,
//   };
//   const kidSize = {
//     4: 1,
//     5: 1,
//     6: 1,
//     7: 1,
//     8: 1,
//     9: 1,
//     10: 1,
//   };
//   const free = {
//     FREE: 1,
//   };
//   try {
//     const products = await Product.find();
//     for (const item of products) {
//       if (item.category === "키즈" || item.category === "토들러") {
//         item.size = kidSize;
//       } else if (item.category === "탑 & 티셔츠" || item.category === "플리스" || item.category === "아우터") {
//         item.size = clothSize;
//       } else if (item.category === "하의") {
//         item.size = bottomSize;
//       } else if (
//         item.category === "양말" ||
//         item.category === "모자" ||
//         item.category === "벨트" ||
//         item.category === "가방" ||
//         item.category === "기타"
//       ) {
//         item.size = free;
//       } else {
//         item.size = shoesSize;
//       }
//       await item.save();
//     }
//     res.status(200).json({ msg: "Update Successfully" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   } finally {
//     res.end();
//   }
// });

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
