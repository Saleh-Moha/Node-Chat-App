const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const cookie = require("cookie");

const authRoutes = require("./routes/auth.routes");
const chatRoutes = require("./routes/chat.routes");
const groupRoutes = require("./routes/createGroup.routes")
const User = require("./models/Users.model");
const Message = require("./models/Message");
const Group = require("./models/Group");

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

// WebSocket Events 
io.on("connection", async (socket) => {
    console.log(`User connected: ${socket.user.id || "No User ID"}`);
    users[socket.user.id] = socket.id;


    const userGroups = await Group.find({ members: socket.user.id });
    userGroups.forEach((group) => socket.join(`group_${group._id}`));


    socket.on("sendMessage", async ({ type, roomId, message }) => {
        try {
            let newMessage;
            if (type === "private") {
                const recipientSocket = users[roomId]; // roomId is the recipient's userId
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
                newMessage = await Message.create({
                    sender: socket.user.id,
                    group: roomId,
                    content: message,
                });
                io.to(`group_${roomId}`).emit("receiveMessage", JSON.stringify({ sender: socket.user.id, message }));
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
                if (!group || !group.members.includes(socket.user.id)&& group.admin.toString() !== socket.user.id) {
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

    // Leave Group or Channel 
    socket.on("leaveRoom", ({ type, roomId }) => {
        if (type === "group") {
            socket.leave(`group_${roomId}`);
        } 
        console.log(`[User Left] ${socket.user.id} left ${type} ${roomId}`);
    });

    // Disconnect Handler
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.user.id}`);
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
