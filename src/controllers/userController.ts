import { Request, Response } from "express";
import { UserService } from "../services/dbServices/userService";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

export default class UserController {
  static async getAllUsers(_req: Request, res: Response) {
    try {
      const users = await UserService.findAll();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // UPDATE: use new search function
  static async searchUsers(req: Request, res: Response) {
    try {
      const search = typeof req.query.q === "string" ? req.query.q : "";
      const users = await UserService.searchByNameOrEmail(search, 10); // <-- updated!
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getUserById(req: Request, res: Response) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    try {
      const user = await UserService.findById(id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
  static async createUser(req: Request, res: Response) {
    try {
      const { name, email, password, role } = req.body;
      const existing = await UserService.findByEmail(email);
      if (existing) return res.status(409).json({ error: "Email already exists" });
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await UserService.createUser({ name, email, passwordHash, role });
      res.status(201).json({ user });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
  static async updateUser(req: Request, res: Response) {
    try {
      const user = await UserService.update(req.params.id, req.body);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ user });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
  static async deleteUser(req: Request, res: Response) {
    try {
      const success = await UserService.delete(req.params.id);
      if (!success) return res.status(404).json({ error: "User not found" });
      res.json({ message: "User deleted" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}