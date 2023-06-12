const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
  },
  // {
  //   collection: function (doc) {
  //     return doc.category;
  //   },
  // }
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
