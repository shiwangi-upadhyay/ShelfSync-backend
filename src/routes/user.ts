import { Router } from "express";
import UserController from "../controllers/userController";
import { requireAuth, requireRole } from "../middleware/auth";
import AuthController from "../controllers/authController";
import { validate } from "../middleware/validationMiddleware";
import { userZod } from "../zod";


const router = Router();

// for all authenticated users
router.use(requireAuth)

// (for all authenticated users)
router.get("/search", validate(userZod.searchUsersSchema), UserController.searchUsers);

// Get all users (admin only)
router.get("/", UserController.getAllUsers);

// Get current user
router.get("/me", AuthController.me);

// Get user by ID (admin or self)
router.get("/:id", validate(userZod.getUserByIdSchema), UserController.getUserById);

// Create user (admin only)
router.post("/", validate(userZod.createUserSchema), UserController.createUser);

// Update user (admin or self)
router.put("/:id", validate(userZod.updateUserSchema), UserController.updateUser);

// Delete user (admin only)
router.delete("/:id", validate(userZod.deleteUserSchema), UserController.deleteUser);

export default router;