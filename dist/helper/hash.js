"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const bcrypt_1 = __importDefault(require("bcrypt"));
const SALT_ROUNDS = 10;
/**
 * Hashes a plain text password.
 * @param password - The password to hash
 * @returns Promise<string> - The hashed password
 */
async function hashPassword(password) {
    return await bcrypt_1.default.hash(password, SALT_ROUNDS);
}
/**
 * Compares a plain text password with a bcrypt hash.
 * @param password - The plain password
 * @param hash - The hashed password
 * @returns Promise<boolean> - True if match, false otherwise
 */
async function verifyPassword(password, hash) {
    return await bcrypt_1.default.compare(password, hash);
}
// Example usage: Hash "admin1234" when running this file directly
if (require.main === module) {
    hashPassword("admin1234").then(hash => {
        console.log(`Hashed password for "admin1234": ${hash}`);
    });
}
// $2b$10$D/GAbLK/vIhJYUmJKuVJ4e5tqWXz37hUdzICtyduoDI9g9bqgnqF.
