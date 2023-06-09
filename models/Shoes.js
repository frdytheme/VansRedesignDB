const mongoose = require('mongoose');

const shoesSchema = mongoose.Schema({
  style: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  img: {
    type: Array,
    required: true,
  },
  size: {
    type: Array,
    required: true,
  }
})