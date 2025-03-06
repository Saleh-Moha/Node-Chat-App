const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const cookie = require("cookie");

const { GoogleGenerativeAI } = require("@google/generative-ai");

const authRoutes = require("./routes/auth.routes");
const chatRoutes = require("./routes/chat.routes");
const groupRoutes = require("./routes/gruop/group.routes")
const User = require("./models/Users.model");
const Message = require("./models/Message");
const Group = require("./models/Group");
const { checkPrime } = require("crypto");
const { error } = require("console");

// redis
const AIChat = require("./models/AiChat")
const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "*",  
        methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"], 
});

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/group", groupRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

const users = {};

// function to save the redis cach to db after disconnecting
async function saveRedisToMongo(userId) {
    const chatHistory = await redis.lrange(`chat:${userId}`, 0, -1);
    if (!chatHistory.length) return;

    let chatData = await AIChat.findOne({ userId });
    if (!chatData) {
        chatData = new AIChat({ userId, messages: [] });
    }

    chatHistory.forEach(msg => {
        chatData.messages.push(JSON.parse(msg));
    });

    await chatData.save();
    await redis.del(`chat:${userId}`);
}


// funciton to chat with ai
async function generateItinerary(message) {
    try{
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = message;

        const result = await model.generateContent(prompt);
        const response = result.response.text();
        return response;
        }catch (error) {
            console.error("Error generating itinerary:", error);
            return "Sorry, I couldn't generate the itinerary.";
          }
    
}

// WebSocket (Socket.IO) Authentication 
io.use((socket, next) => {
    let token = socket.handshake.query.token || 
                (socket.handshake.headers.cookie && cookie.parse(socket.handshake.headers.cookie).token);

    console.log("Received Token:", token); 

    if (!token) {
        console.log("No token provided!");
        return next(new Error("Authentication Error"));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        socket.user = decoded;
        console.log("Decoded User:", decoded); 
        next();
    } catch (err) {
        console.log("Token verification failed!", err.message);
        return next(new Error("Authentication Error"));
    }
});


// Websocket connection
io.on("connection", async (socket) => {

    users[socket.user.id] = socket.id;


    const userGroups = await Group.find({ members: socket.user.id });
    userGroups.forEach((group) => socket.join(`group_${group._id}`));


    socket.on("sendMessage", async ({ type, roomId, message }) => {
        try {
            let newMessage;
            if (type === "private") {
                const recipientSocket = users[roomId]; 
                user = User.findById(socket.user.id)
                newMessage = await Message.create({
                    sender: socket.user.id,
                    recipient: roomId,
                    content: message,
                });

                if (recipientSocket) {
                    io.to(recipientSocket).emit("receiveMessage", JSON.stringify({ sender: socket.user.id, message }));
                }
            } else if (type === "group") {
                const checkGroupStatus = await Group.findById(roomId);
                if (!checkGroupStatus) {
                    return socket.emit("error", { message: "Group not found" });
                }

                const isMember = checkGroupStatus.members.includes(socket.user.id);
                const isAdmin = checkGroupStatus.admins.includes(socket.user.id);

                if (!isMember && !isAdmin) {
                    return socket.emit("error", { message: "You are not a member of this group" });
                }

                if (checkGroupStatus.message_status === true && !isAdmin) {
                    return socket.emit("error", { message: "Only admins can send messages" });
                }

            // Create group message
                newMessage = await Message.create({
                    sender: socket.user.id,
                    group: roomId,
                    content: message,
                });

                io.to(`group_${roomId}`).emit("receiveMessage",JSON.stringify({
                    sender: socket.user.id,
                    message
                }));
        }

            console.log(`[Message Sent] ${type} -> ${roomId}: ${message}`);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    });

    // Join Group
    socket.on("joinRoom", async ({ type, roomId }) => {
        try {
            if (type === "group") {
                const group = await Group.findById(roomId);
                if (!group || !group.members.includes(socket.user.id)&& group.admins.toString() !== socket.user.id) {
                    return socket.emit("error", { message: "Not authorized to join this group" });
                }
                socket.join(`group_${roomId}`);
            }

            console.log(`[User Joined] ${socket.user.id} joined ${type} ${roomId}`);
            socket.emit("roomJoined", { roomId, type });
        } catch (error) {
            socket.emit("error", { message: "Error joining room" });
        }
    });

    
    socket.on("leaveRoom", ({ type, roomId }) => {
        if (type === "group") {
            socket.leave(`group_${roomId}`);
        } 
        console.log(`[User Left] ${socket.user.id} left ${type} ${roomId}`);
    });

    
    socket.on("ChatWithAI", async (data) => {
        try {
            if (!data.message) {
                return socket.emit("error", { message: "No message sent" });
            }
    
            const userId = socket.user.id;
            
    
            let chatHistory = await redis.lrange(`chat:${userId}`, -5, -1); 
            chatHistory = chatHistory.map(JSON.parse); 
    
            // Format prompt with context
            const lastMessages = chatHistory.map(msg => `${msg.role}: ${msg.content}`).join("\n");
            const prompt = lastMessages ? `Previous messages:\n${lastMessages}\n\nUser: ${data.message}` : data.message;
    
    
            const aiResponse = await generateItinerary(prompt);
            if (!aiResponse) {
                return socket.emit("error", { message: "AI response failed" });
            }
    
            await redis.rpush(`chat:${userId}`, JSON.stringify({ role: "user", content: data.message }));
            await redis.rpush(`chat:${userId}`, JSON.stringify({ role: "ai", content: aiResponse }));
    
            await redis.ltrim(`chat:${userId}`, -10, -1);
    
            socket.emit("recieved",JSON.stringify( { itinerary: aiResponse }));
    
            console.log(`[AI Response Sent] to ${userId}`);
        } catch (error) {
            console.error("Error processing AI request:", error);
            socket.emit("error", { message: "Internal Server Error" });
        }
    });
    

    // Disconnect Handler
    socket.on("disconnect", async() => {
        console.log(`User disconnected: ${socket.user.id}`);
        await saveRedisToMongo(socket.user.id);
        delete users[socket.user.id];
    });
});

// Debugging Connection Errors 
io.on("connect_error", (err) => {
    console.error("Socket Connection Error:", err.message);
});

// Start Server 
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
