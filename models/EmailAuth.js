const mongoose = require("mongoose");

const emailAuthSchema = mongoose.Schema({
  data: {
    type: String,
    default: "null",
    required: true,
  },
  email: {
    type: String,
    default: "UnKnown Email",
    required: true,
  },
  expiryDate: {
    type: Date,
    expires: "2m",
    default: Date.now,
  },
});

const EmailAuth = mongoose.model("EmailAuth", emailAuthSchema);
module.exports = EmailAuth;
