const { createServer } = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3000;

// 1. HTTP Server banaya (Browser ko dikhane ke liye)
const httpServer = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("✅ Signaling Server is Running & Ready!");
});

// 2. Socket Server banaya (Calls connect karne ke liye)
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

console.log(`Signaling Server running on port ${PORT}`);

// Rooms: 'laptop' and 'android'
io.on("connection", (socket) => {
  
  socket.on("join", (role) => {
    socket.join(role);
    console.log(`${role} joined with ID: ${socket.id}`);
  });

  // Laptop calls Android
  socket.on("call-initiate", (data) => {
    console.log("Laptop is calling Android...");
    io.to("android").emit("incoming-call", data);
  });

  // WebRTC Signaling Data Exchange (Offer/Answer/ICE)
  socket.on("signal", (data) => {
    const target = data.target === "laptop" ? "laptop" : "android";
    io.to(target).emit("signal", data);
  });

});

// 3. Server start kiya
httpServer.listen(PORT);
