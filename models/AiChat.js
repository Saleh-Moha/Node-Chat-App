const mongoose = require("mongoose");

const AIChatSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    messages: [
        {
            role: { type: String, enum: ["user", "ai"], required: true }, // Who sent the message
            content: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }
    ]
});

const AIChat = mongoose.model("AIChat", AIChatSchema);
module.exports = AIChat;