import { Request, Response } from "express";
import { UserService } from "../services/dbServices/userService";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import transporter from "../config/email";
import Otp from "../models/otp";

export default class AuthController {
  static async signup(req: Request, res: Response) {
    try {
      const { name, email, password, role } = req.body;
      const existing = await UserService.findByEmail(email);
      if (existing)
        return res.status(409).json({ error: "Email already exists" });
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await UserService.createUser({
        name,
        email,
        passwordHash,
        role,
      });
      res.status(201).json({ user });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await UserService.findByEmail(email);
      if (!user) return res.status(404).json({ error: "User not found" });
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid)
        return res.status(401).json({ error: "Invalid password" });
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: "30d" }
      );
      res
        .cookie("authToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production", // ✅ must be true on Render
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // ✅ required for cross-domain
          maxAge: 30 * 24 * 60 * 60 * 1000,
          path: "/",
        })
        .json({
          message: "Login successful",
          user: { id: user._id, email: user.email, role: user.role },
        });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
  static async logout(_req: Request, res: Response) {
    try {
      res.clearCookie("authToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
      });
      res.json({ message: "Logout successful" });
      console.log("User logged out, authToken cookie cleared.");
    } catch (err: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const user = await UserService.findByEmail(email);
      if (!user) return res.status(404).json({ error: "User not found" });
      await UserService.createOtp(email);
      res.json({ message: "OTP sent to your email" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async createOtp(email: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    await Otp.create({ email, otp, expiresAt });

    // --- Send OTP Email ---
    await transporter.sendMail({
      from: `"ShelfSync" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your ShelfSync OTP Code",
      text: `Your OTP code is: ${otp}. It expires in 10 minutes.`,
      html: `<p>Your OTP code is: <b>${otp}</b></p><p>It expires in 10 minutes.</p>`,
    });

    return otp;
  }

  static async verifyOtp(req: Request, res: Response) {
    try {
      const { email, otp } = req.body;
      const isValid = await UserService.verifyOtp(email, otp);
      if (!isValid)
        return res.status(400).json({ error: "Invalid or expired OTP" });
      res.json({ message: "OTP verified" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { email, otp, password } = req.body;
      const success = await UserService.resetPassword(email, otp, password);
      if (!success)
        return res.status(400).json({ error: "Invalid or expired OTP" });
      res.json({ message: "Password reset successful" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
  static async me(req: Request, res: Response) {
    // console.log("req.user at /me:", req.user);
    try {
      // req.user is set by requireAuth middleware
      const { userId, email, role } = req.user!;
      res.json({ _id: userId, email, role }); // <-- Use _id instead of userId
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
