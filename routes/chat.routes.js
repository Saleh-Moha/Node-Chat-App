const express = require("express");
const { sendMessage, getMessages } = require("../controllers/chatController");
const authMiddleware = require("../middelwares/authMiddleware");

const router = express.Router();

router.post("/send", authMiddleware, sendMessage);
router.get("/messages/:roomId", authMiddleware, getMessages);

module.exports = router;
