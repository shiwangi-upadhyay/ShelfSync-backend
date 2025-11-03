
import { z } from "zod";
import mongoose from "mongoose";

const objectIdSchema = z.string().refine(
    (val) => mongoose.Types.ObjectId.isValid(val),
    { message: "Invalid ObjectId" }
);

export const createMemberRequestSchema = z.object({
    body: z.object({
        requestingProject: objectIdSchema,
        requestedMember: objectIdSchema,
        requestType: z.enum(["dedicated", "shared"] as const, {
            error: "Request type must be either 'dedicated' or 'shared'",
        }),
        reason: z.string().max(500).optional(),
    }),
});

export const getMemberRequestByIdSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
});

export const approveRequestSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
});

export const rejectRequestSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
    body: z.object({
        rejectionReason: z
            .string()
            .min(10, "Rejection reason must be at least 10 characters")
            .max(500),
    }),
});

export const cancelRequestSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
});
