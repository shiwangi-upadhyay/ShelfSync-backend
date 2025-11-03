// schemas/teamSchemas.ts
import { z } from "zod";
import mongoose from "mongoose";

const objectIdSchema = z.string().refine(
    (val) => mongoose.Types.ObjectId.isValid(val),
    { message: "Invalid ObjectId" }
);

const teamMemberSchema = z.object({
    user: objectIdSchema,
    canCreateTask: z.boolean().default(false),
});

export const createTeamSchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(2, "Team name must be at least 2 characters")
            .max(100, "Team name must not exceed 100 characters"),
        projectId: objectIdSchema,
        members: z.array(teamMemberSchema).optional().default([]),
    }),
});

export const updateTeamSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
    body: z.object({
        name: z.string().min(2).max(100).optional(),
        members: z.array(teamMemberSchema).optional(),
    }),
});

export const getTeamByIdSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
});

export const getTeamsByProjectSchema = z.object({
    params: z.object({
        projectId: objectIdSchema,
    }),
});

export const addMemberToTeamSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
    body: z.object({
        userId: objectIdSchema,
        canCreateTask: z.boolean().optional().default(false),
    }),
});

export const removeMemberFromTeamSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
    body: z.object({
        userId: objectIdSchema,
    }),
});

export const deleteTeamSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
});
