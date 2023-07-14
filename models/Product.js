const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  id: {
    type: String,
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
  mainCategory: {
    type: Array,
    default: ["ALL"],
    required: true,
  },
  category: {
    type: String,
    default: "Unknown Product",
    required: true,
  },
  price: {
    type: Number,
    default: 0,
    required: true,
  },
  color: {
    type: String,
    default: "Unknown Product",
    required: true,
  },
  size: {
    type: Object,
    default: {},
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  }
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
