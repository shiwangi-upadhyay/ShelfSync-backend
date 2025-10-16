"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const user_1 = __importDefault(require("../../models/user"));
const otp_1 = __importDefault(require("../../models/otp"));
const bcrypt_1 = __importDefault(require("bcrypt"));
class UserService {
    static async findAll() {
        return await user_1.default.find({}, { passwordHash: 0 });
    }
    static async searchByName(query, limit = 10) {
        // Match anywhere in the name, case-insensitive
        return user_1.default.find({
            name: { $regex: query, $options: "i" }
        }).limit(limit);
    }
    static async findById(userId) {
        return await user_1.default.findById(userId, { passwordHash: 0 });
    }
    static async findByEmail(email) {
        return await user_1.default.findOne({ email });
    }
    static async createUser({ name, email, passwordHash, role = "member" }) {
        const user = new user_1.default({ name, email, passwordHash, role });
        return await user.save();
    }
    static async update(userId, userData) {
        return await user_1.default.findByIdAndUpdate(userId, userData, { new: true, fields: { passwordHash: 0 } });
    }
    static async delete(userId) {
        const result = await user_1.default.findByIdAndDelete(userId);
        return !!result;
    }
    static async createOtp(email) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
        await otp_1.default.create({ email, otp, expiresAt });
        // TODO: Send OTP via email here!
        return otp;
    }
    static async verifyOtp(email, otp) {
        const record = await otp_1.default.findOne({ email, otp });
        if (!record || record.expiresAt < new Date())
            return false;
        return true;
    }
    static async resetPassword(email, otp, newPassword) {
        const valid = await UserService.verifyOtp(email, otp);
        if (!valid)
            return false;
        const passwordHash = await bcrypt_1.default.hash(newPassword, 10);
        await user_1.default.findOneAndUpdate({ email }, { passwordHash });
        await otp_1.default.deleteMany({ email }); // Remove used OTPs
        return true;
    }
}
exports.UserService = UserService;
