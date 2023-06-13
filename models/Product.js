const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  id: {
    type: Number,
    default: "Unknown Product",
    required: true,
  },
  model: {
    type: String,
    default: "Unknown Product",
    required: true,
  },
  name: {
    type: String,
    default: "Unknown Product",
    required: true,
  },
  category: {
    type: String,
    default: "Unknown Product",
    required: true,
  },
  price: {
    type: String,
    default: "Unknown Product",
    required: true,
  },
  color: {
    type: String,
    default: "Unknown Product",
    required: true,
  },
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
