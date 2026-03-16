import { io } from "socket.io-client";

// IMPORTANT: Strip any path suffix from the API URL — Socket.io must connect
// to the bare origin (http://localhost:5000), not the REST base URL
// (http://localhost:5000/api). Passing "/api" as the URL makes Socket.io
// treat it as a namespace which the server never registered, causing
// an "Invalid namespace" error and silently preventing real-time events.
const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000")
  .replace(/\/api\/?$/, "");

const socket = io(BASE_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  withCredentials: true,
  auth: (cb) => {
    const token = localStorage.getItem("token");
    cb({ token });
  },
});

export default socket;
