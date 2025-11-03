
import { z } from "zod";
import mongoose from "mongoose";

// Helper for MongoDB ObjectId validation
const objectIdSchema = z.string().refine(
    (val) => mongoose.Types.ObjectId.isValid(val),
    { message: "Invalid ObjectId" }
);

export const createUserSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters").max(100),
        email: z.string().email("Invalid email address"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(100)
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                "Password must contain at least one uppercase letter, one lowercase letter, and one number"
            ),
        role: z
            .enum(["super_admin", "project_owner", "user"])
            .optional()
            .default("user"),
        memberType: z.enum(["dedicated", "shared"]).optional(),
    }),
});

export const updateUserSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
    body: z.object({
        name: z.string().min(2).max(100).optional(),
        email: z.string().email().optional(),
        role: z.enum(["super_admin", "project_owner", "user"]).optional(),
        memberType: z.enum(["dedicated", "shared"]).optional(),
        activeProjectCount: z.number().min(0).max(2).optional(),
    }),
});

export const getUserByIdSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
});

export const searchUsersSchema = z.object({
    query: z.object({
        q: z.string().optional().default(""),
        page: z.string().regex(/^\d+$/).optional().default("1"),
        limit: z.string().regex(/^\d+$/).optional().default("10"),
    }),
});

export const deleteUserSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
});
