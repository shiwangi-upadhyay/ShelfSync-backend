"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userService_1 = require("../services/dbServices/userService");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const email_1 = __importDefault(require("../config/email"));
const otp_1 = __importDefault(require("../models/otp"));
class AuthController {
    static async signup(req, res) {
        try {
            const { name, email, password, role } = req.body;
            const existing = await userService_1.UserService.findByEmail(email);
            if (existing)
                return res.status(409).json({ error: "Email already exists" });
            const passwordHash = await bcrypt_1.default.hash(password, 10);
            const user = await userService_1.UserService.createUser({
                name,
                email,
                passwordHash,
                role,
            });
            res.status(201).json({ user });
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await userService_1.UserService.findByEmail(email);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const isPasswordValid = await bcrypt_1.default.compare(password, user.passwordHash);
            if (!isPasswordValid)
                return res.status(401).json({ error: "Invalid password" });
            const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "30d" });
            res
                .cookie("authToken", token, {
                httpOnly: true,
                secure: false, // true for HTTPS; false for localhost
                sameSite: "lax", // or "none" if using localhost:3000 & localhost:5000 (cross-origin)
                maxAge: 30 * 24 * 60 * 60 * 1000,
                path: "/",
            })
                .json({
                message: "Login successful",
                user: { id: user._id, email: user.email, role: user.role },
            });
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async logout(_req, res) {
        try {
            res.clearCookie("token");
            res.json({ message: "Logout successful" });
        }
        catch (err) {
            res.status(500).json({ error: "Internal server error" });
        }
    }
    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const user = await userService_1.UserService.findByEmail(email);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            await userService_1.UserService.createOtp(email);
            res.json({ message: "OTP sent to your email" });
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async createOtp(email) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
        await otp_1.default.create({ email, otp, expiresAt });
        // --- Send OTP Email ---
        await email_1.default.sendMail({
            from: `"ShelfSync" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Your ShelfSync OTP Code",
            text: `Your OTP code is: ${otp}. It expires in 10 minutes.`,
            html: `<p>Your OTP code is: <b>${otp}</b></p><p>It expires in 10 minutes.</p>`,
        });
        return otp;
    }
    static async verifyOtp(req, res) {
        try {
            const { email, otp } = req.body;
            const isValid = await userService_1.UserService.verifyOtp(email, otp);
            if (!isValid)
                return res.status(400).json({ error: "Invalid or expired OTP" });
            res.json({ message: "OTP verified" });
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async resetPassword(req, res) {
        try {
            const { email, otp, password } = req.body;
            const success = await userService_1.UserService.resetPassword(email, otp, password);
            if (!success)
                return res.status(400).json({ error: "Invalid or expired OTP" });
            res.json({ message: "Password reset successful" });
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async me(req, res) {
        // console.log("req.user at /me:", req.user);
        try {
            // req.user is set by requireAuth middleware
            const { userId, email, role } = req.user;
            res.json({ _id: userId, email, role }); // <-- Use _id instead of userId
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
}
exports.default = AuthController;
