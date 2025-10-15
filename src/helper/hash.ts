import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

/**
 * Hashes a plain text password.
 * @param password - The password to hash
 * @returns Promise<string> - The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plain text password with a bcrypt hash.
 * @param password - The plain password
 * @param hash - The hashed password
 * @returns Promise<boolean> - True if match, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Example usage: Hash "admin1234" when running this file directly
if (require.main === module) {
  hashPassword("admin1234").then(hash => {
    console.log(`Hashed password for "admin1234": ${hash}`);
  });
}

// $2b$10$D/GAbLK/vIhJYUmJKuVJ4e5tqWXz37hUdzICtyduoDI9g9bqgnqF.