import mongoose from 'mongoose';
import { z } from 'zod';

const objectIdSchema = z.string().refine(
    (val) => mongoose.Types.ObjectId.isValid(val),
    { message: "Invalid ObjectId" }
);

export const createDepartmentSchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(2, "Department name must be at least 2 characters")
            .max(100, "Department name must not exceed 100 characters"),
        description: z.string().max(500).optional(),
    }),
});

export const updateDepartmentSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
    body: z.object({
        name: z.string().min(2).max(100).optional(),
        description: z.string().max(500).optional(),
    }),
});

export const getDepartmentByIdSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
});

export const deleteDepartmentSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
});