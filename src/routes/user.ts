import { Router } from "express";
import UserController from "../controllers/userController";
import { requireAuth, requireRole } from "../middleware/auth";
import AuthController from "../controllers/authController";


const router = Router();

// (for all authenticated users)
router.get("/search", requireAuth, UserController.searchUsers);

// Get all users (admin only)
router.get("/", requireAuth,  UserController.getAllUsers);

// Get current user
router.get("/me", requireAuth, AuthController.me);

// Get user by ID (admin or self)
router.get("/:id", requireAuth, UserController.getUserById);

// Create user (admin only)
router.post("/", requireAuth,  UserController.createUser);

// Update user (admin or self)
router.put("/:id", requireAuth, UserController.updateUser);

// Delete user (admin only)
router.delete("/:id", requireAuth, UserController.deleteUser);

export default router;