import dotenv from "dotenv";
import connectDB from "./config/db";
import "./workers/emailWorker";
import "./workers/inAppWorker";

dotenv.config();

// Connect to MongoDB for notification storage
connectDB();

console.log("Workers started and listening for jobs...");

// Keep the process alive
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: shutting down workers');
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT signal received: shutting down workers');
    process.exit(0);
});
