"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = __importDefault(require("../controllers/userController"));
const auth_1 = require("../middleware/auth");
const authController_1 = __importDefault(require("../controllers/authController"));
const router = (0, express_1.Router)();
// (for all authenticated users)
router.get("/search", auth_1.requireAuth, userController_1.default.searchUsers);
// Get all users (admin only)
router.get("/", auth_1.requireAuth, userController_1.default.getAllUsers);
// Get current user
router.get("/me", auth_1.requireAuth, authController_1.default.me);
// Get user by ID (admin or self)
router.get("/:id", auth_1.requireAuth, userController_1.default.getUserById);
// Create user (admin only)
router.post("/", auth_1.requireAuth, userController_1.default.createUser);
// Update user (admin or self)
router.put("/:id", auth_1.requireAuth, userController_1.default.updateUser);
// Delete user (admin only)
router.delete("/:id", auth_1.requireAuth, userController_1.default.deleteUser);
exports.default = router;
