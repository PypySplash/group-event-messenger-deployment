import { io } from "socket.io-client";

// "undefined" means the URL will be computed from the `window.location` object
// In production, we need to point to the actual socket server URL
const URL = 
  process.env.NODE_ENV === "production"
    ? "https://group-event-messenger-socket.onrender.com"
    : "http://localhost:3001";

// Debug log to check where it's trying to connect
if (typeof window !== "undefined") {
  console.log("🔌 Initializing socket with URL:", URL);
}

export const socket = io(URL, {
  autoConnect: false,
});
