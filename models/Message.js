const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  channel: { type: mongoose.Schema.Types.ObjectId, ref: "Channel" },
  content: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
