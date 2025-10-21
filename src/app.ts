import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import routes from "./routes/index";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cookieParser());

// ✅ Enable CORS before routes
app.use(
  cors({
    origin: ["http://localhost:3000", "https://shelf-sync-seven.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
  })
);

app.use(express.json());

// Connect MongoDB
connectDB();

// Use routes
app.use("/", routes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
