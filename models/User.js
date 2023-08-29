const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    maxlength: 50,
    required: true,
  },
  email: {
    type: String,
    trim: true,
    required: true,
  },
  password: {
    type: String,
    minlength: 5,
    required: true,
  },
  refresh: {
    type: String,
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
