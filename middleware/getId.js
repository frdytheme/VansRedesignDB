const Product = require("../models/Product");

module.exports = async function (req, res, next) {
  let product;
  try {
    product = await Product.findById(req.params.id);
    if (product == null) {
      return res.status(404).json({ message: "모델을 찾을 수 없습니다." });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  res.product = product;
  next();
};
