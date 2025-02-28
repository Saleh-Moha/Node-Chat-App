const bcrypt = require('bcryptjs')
const User = require('../models/Users.model')
const generateToken = require('../middelwares/generateTokens')



const signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });

        await newUser.save();
        
        const Token = await generateToken({
            username: newUser.username,
            email: newUser.email,
            id: newUser._id,
            role: newUser.role
        });

        res.cookie("Token", Token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Signup Error:", error); // Logs error in terminal
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};



const login =  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: "User not found" });
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
  
      const token = await generateToken({email:user.email , id:user._id , role:user.role })
  
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "Strict" })
        return res.json({ message: "Login successful",token, user });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
}; 


module.exports = {
    signup,
    login
}