"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userService_1 = require("../services/dbServices/userService");
const bcrypt_1 = __importDefault(require("bcrypt"));
const mongoose_1 = __importDefault(require("mongoose"));
class UserController {
    static async getAllUsers(_req, res) {
        try {
            const users = await userService_1.UserService.findAll();
            res.json(users);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    // this method for search endpoint
    static async searchUsers(req, res) {
        try {
            const search = typeof req.query.q === "string" ? req.query.q : "";
            // You may need to add a search method to UserService, or use the model directly
            const users = await userService_1.UserService.searchByName(search, 10); // Limit to 10 results
            res.json(users);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    static async getUserById(req, res) {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }
        try {
            const user = await userService_1.UserService.findById(id);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            res.json(user);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    static async createUser(req, res) {
        try {
            const { name, email, password, role } = req.body;
            const existing = await userService_1.UserService.findByEmail(email);
            if (existing)
                return res.status(409).json({ error: "Email already exists" });
            const passwordHash = await bcrypt_1.default.hash(password, 10);
            const user = await userService_1.UserService.createUser({ name, email, passwordHash, role });
            res.status(201).json({ user });
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async updateUser(req, res) {
        try {
            const user = await userService_1.UserService.update(req.params.id, req.body);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            res.json({ user });
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async deleteUser(req, res) {
        try {
            const success = await userService_1.UserService.delete(req.params.id);
            if (!success)
                return res.status(404).json({ error: "User not found" });
            res.json({ message: "User deleted" });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}
exports.default = UserController;
