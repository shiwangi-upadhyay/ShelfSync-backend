"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const user_1 = __importDefault(require("./user"));
const team_1 = __importDefault(require("./team"));
const task_1 = __importDefault(require("./task"));
const router = (0, express_1.Router)();
router.use("/teams", team_1.default);
router.use("/", user_1.default);
router.use("/", auth_1.default);
router.use("/tasks", task_1.default);
exports.default = router;
