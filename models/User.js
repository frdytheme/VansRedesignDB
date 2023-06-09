const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
  name: {
    type: String,
    maxlength: 50,
    required: true,
},
email: {
    type: String,
    trim: true,  // 공백을 없애주는 역할
    unique: 1,  // 똑같은 이메일을 쓰지 못하도록
    required: true,
},
password: {
    type: String,
    minlength: 5,
    required: true,
},
})

const User = mongoose.model('User', userSchema)
module.exports = User