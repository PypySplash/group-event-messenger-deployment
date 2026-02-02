import { Server } from "socket.io";
import { createServer } from "http";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for simplicity
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  // Join a room based on eventId
  socket.on("join_room", (eventId) => {
    socket.join(eventId);
    console.log(`User ${socket.id} joined room ${eventId}`);
  });

  // Handle sending messages
  // This is actually just a relay. The client sends a message here
  // AFTER it has successfully POSTed to the Next.js API.
  // The server then broadcasts it to everyone else in the room.
  socket.on("send_message", (data) => {
    // data should contain: eventId, and the message object
    const { eventId, comment } = data;
    console.log(`Message in room ${eventId}:`, comment);
    
    // Broadcast to everyone in the room INCLUDING sender (or excluding if we wish)
    // usually excluding sender is better for optimistic UI but keeping simple for now
    // logic: socket.to(eventId).emit(...) sends to everyone BUT sender
    // io.to(eventId).emit(...) sends to everyone INCLUDING sender
    
    // Since we are not doing optimistic UI in the client perfectly yet,
    // let's assume client handles its own display, so we broadcast to OTHERS.
    // BUT, wait, if we use the API to fetch list, we might miss the live update if we don't listen.
    // Let's broadcast to everyone for simplicity, but client needs to handle deduplication or 
    // simply just append if it's new.
    
    socket.to(eventId).emit("receive_message", comment);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
