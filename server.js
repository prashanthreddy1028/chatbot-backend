const express = require('express');
const mysql = require('mysql2');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",  // ✅ Allow React frontend
        methods: ["GET", "POST"]
    }
});

// ✅ Middleware

app.use(express.json()); 
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// ✅ MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: 'Reddy@123', 
    database: 'chat_bot'
});

db.connect(err => {
    if (err) {
        console.error("❌ MySQL Connection Error:", err);
        process.exit(1); // Exit if connection fails
    }
    console.log("✅ MySQL Connected!");
});



// ✅ Debug POST /sendmessage API
app.post('/sendmessage', async (req, res) => {
    console.log("📩 Inside POST /sendmessage");  
    console.log("🛠️ Headers:", req.headers); 
    console.log("🛠️ Body:", req.body);  

    const { username, message } = req.body;

    if (!username || !message) {
        console.log("❌ Missing Data");
        return res.status(400).json({ error: "Username and message are required" });
    }

    const sql = "INSERT INTO messages (username, message) VALUES (?, ?)";
    db.query(sql, [username, message], (err, result) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        const newMessage = { id: result.insertId, username, message };
        io.emit("receive_message", newMessage);
        res.status(200).json({ success: true, message: newMessage });
    });
});

// ✅ Debug GET /messages API
app.get("/messages", (req, res) => {
    console.log("📩 Inside GET /messages API");
    db.query("SELECT * FROM messages", (err, result) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(result);
    });
});

// ✅ Start Server
server.listen(5000, () => console.log("🚀 Server running on port 5000"));
