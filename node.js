const io = require("socket.io")(3000, {
  cors: { origin: "*" }
});

console.log("Signaling Server running on port 3000");

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
    // Agar sender laptop hai toh android ko bhejo, vice versa
    const target = data.target === "laptop" ? "laptop" : "android";
    io.to(target).emit("signal", data);
  });

});
