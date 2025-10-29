// app.ts

import express from "express";
import { createServer } from 'http';
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import routes from "./routes/index";
import cookieParser from "cookie-parser";
// import { setSocketIO } from "./workers/inAppWorker";
import Notification from "./models/notification";
import { setSocketIo } from "./workers/inAppWorker";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:3000",
        "https://shelf-sync-seven.vercel.app",
      ];

      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  }
});

// Set Socket.IO instance for worker
setSocketIo(io);

const PORT = process.env.PORT || 5000;

// CORS middleware for Express
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:3000",
        "https://shelf-sync-seven.vercel.app",
      ];

      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// Connect MongoDB
connectDB();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User authenticates and joins their personal notification room
  socket.on('authenticate', async (userId: string) => {
    try {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined their notification room`);

      // Send unread notifications to the user
      const unreadNotifications = await Notification.find({
        userId,
        type: 'in_app',
        read: false
      }).sort({ createdAt: -1 }).limit(50);

      socket.emit('unread-notifications', unreadNotifications);

      // Get unread count
      const unreadCount = await Notification.countDocuments({
        userId,
        type: 'in_app',
        read: false
      });

      socket.emit('unread-count', unreadCount);
    } catch (error) {
      console.error('Error authenticating user:', error);
      socket.emit('error', { message: 'Authentication failed' });
    }
  });

  // Mark notification as read
  socket.on('mark-as-read', async (notificationId: string) => {
    try {
      await Notification.findByIdAndUpdate(notificationId, { read: true });
      socket.emit('notification-read', { notificationId });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  });

  // Mark all notifications as read
  socket.on('mark-all-as-read', async (userId: string) => {
    try {
      await Notification.updateMany(
        { userId, type: 'in_app', read: false },
        { read: true }
      );
      socket.emit('all-notifications-read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  });

  // Get notification history
  socket.on('get-notifications', async ({ userId, page = 1, limit = 20 }) => {
    try {
      const skip = (page - 1) * limit;
      const notifications = await Notification.find({
        userId,
        type: 'in_app'
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Notification.countDocuments({
        userId,
        type: 'in_app'
      });

      socket.emit('notifications-history', {
        notifications,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Use routes
app.use("/", routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Start the HTTP server (not app.listen)
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server ready`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
});

export { io };
