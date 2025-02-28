const mongoose = require('mongoose')
const validator = require('validator')

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, validate: [validator.isEmail, "Field must be a valid email"] },
    password: { type: String },
    role : {type:String , default:'user'}
})


module.exports = mongoose.model('Users',UserSchema)