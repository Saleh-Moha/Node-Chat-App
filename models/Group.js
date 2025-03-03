const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  message_status : {type:Boolean , default:false},
  group_status : {
    type:String,
    enum : ["Private", "Public"],
    default : "Public", 
    required : false
  },
}, { timestamps: true });

module.exports = mongoose.model("Group", groupSchema);
