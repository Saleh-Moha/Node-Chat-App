const jwt = require('jsonwebtoken')
const User = require('../models/Users.model')

module.exports = async (req, res, next) => {
  try {

    const token = req.headers.authorization?.split(" ")[1]?.trim();
    if (!token) return res.status(401).json({ error: "Unauthorized: No Token Provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) return res.status(401).json({ error: "User not found" });

    next();
  } catch (error) {
    console.error("Auth Error:", error.message);
    res.status(401).json({ error: "Invalid token" });
  }
};
