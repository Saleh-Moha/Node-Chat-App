const Message = require("../models/Message");

exports.sendMessage = async (req, res) => {
  try {
    const { roomId, message, type } = req.body;
    const newMessage = await Message.create({
      sender: req.user.username,
      [type]: roomId,
      content: message,
    });

    res.json(newMessage);
  } catch (error) {
    res.status(500).json({ error: "Error sending message" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ group: req.params.roomId }).populate("sender", "username");
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Error fetching messages" });
  }
};
