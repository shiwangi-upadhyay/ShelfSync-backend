// schemas/projectSchemas.ts
import { z } from "zod";
import mongoose from "mongoose";

const objectIdSchema = z.string().refine(
    (val) => mongoose.Types.ObjectId.isValid(val),
    { message: "Invalid ObjectId" }
);

export const createProjectSchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(2, "Project name must be at least 2 characters")
            .max(200, "Project name must not exceed 200 characters"),
        description: z.string().max(1000).optional(),
        department: objectIdSchema,
        projectOwner: objectIdSchema,
    }),
});

export const updateProjectSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
    body: z.object({
        name: z.string().min(2).max(200).optional(),
        description: z.string().max(1000).optional(),
        department: objectIdSchema.optional(),
        projectOwner: objectIdSchema.optional(),
    }),
});

export const getProjectByIdSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
});

export const getProjectsByDepartmentSchema = z.object({
    params: z.object({
        departmentId: objectIdSchema,
    }),
});

export const addMemberToProjectSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
    body: z.object({
        memberId: objectIdSchema,
        memberType: z.enum(["dedicated", "shared"] as const, {
            error: () => ({
                message: "Member type must be either 'dedicated' or 'shared'"
            }),
        }),
    }),
});

export const removeMemberFromProjectSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
    body: z.object({
        memberId: objectIdSchema,
    }),
});

export const deleteProjectSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
});
