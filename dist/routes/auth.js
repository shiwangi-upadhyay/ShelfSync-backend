"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = __importDefault(require("../controllers/authController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post("/signup", authController_1.default.signup);
router.post("/login", authController_1.default.login);
router.post("/logout", auth_1.requireAuth, authController_1.default.logout);
router.post("/forgot-password", authController_1.default.forgotPassword);
router.post("/verify-otp", authController_1.default.verifyOtp);
router.post("/reset-password", authController_1.default.resetPassword);
// router.get("/me", requireAuth, AuthController.me);
exports.default = router;
