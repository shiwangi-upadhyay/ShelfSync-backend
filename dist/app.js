"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./config/db"));
const index_1 = __importDefault(require("./routes/index"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cookie_parser_1.default)());
// ✅ Enable CORS before routes
app.use((0, cors_1.default)({
    origin: "http://localhost:3000", // your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
}));
app.use(express_1.default.json());
// Connect MongoDB
(0, db_1.default)();
// Use routes
app.use("/", index_1.default);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
