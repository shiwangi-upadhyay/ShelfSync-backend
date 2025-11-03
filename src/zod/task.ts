// schemas/taskSchemas.ts
import { z } from "zod";
import mongoose from "mongoose";

const objectIdSchema = z.string().refine(
    (val) => mongoose.Types.ObjectId.isValid(val),
    { message: "Invalid ObjectId" }
);

const commentSchema = z.object({
    text: z.string().min(1, "Comment cannot be empty").max(1000),
    by: objectIdSchema,
    date: z.date().or(z.string().datetime()).optional(),
});

const refFileSchema = z.object({
    url: z.string().url("Invalid file URL"),
    name: z.string().min(1).max(255),
    uploadedBy: objectIdSchema,
    date: z.date().or(z.string().datetime()).optional(),
});

const progressFieldSchema = z.object({
    title: z.string().min(1).max(100),
    value: z.string().max(500),
    by: objectIdSchema,
    date: z.date().or(z.string().datetime()).optional(),
});

export const createTaskSchema = z.object({
    body: z.object({
        team: objectIdSchema,
        desc: z
            .string()
            .min(10, "Description must be at least 10 characters")
            .max(2000),
        topic: z.string().max(200).optional(),
        subTopic: z.string().max(200).optional(),
        startDate: z.string().datetime().or(z.date()).optional(),
        endDate: z.string().datetime().or(z.date()).optional(),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        status: z
            .enum(["not started", "in progress", "completed", "closed"])
            .default("not started"),
        assignedTo: z.array(objectIdSchema).min(1, "At least one assignee required"),
        comments: z.array(commentSchema).optional().default([]),
        refFiles: z.array(refFileSchema).optional().default([]),
        progressFields: z.array(progressFieldSchema).optional().default([]),
    }).refine(
        (data) => {
            if (data.startDate && data.endDate) {
                return new Date(data.startDate) <= new Date(data.endDate);
            }
            return true;
        },
        {
            message: "End date must be after start date",
            path: ["endDate"],
        }
    ),
});

export const updateTaskSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
    body: z.object({
        desc: z.string().min(10).max(2000).optional(),
        topic: z.string().max(200).optional(),
        subTopic: z.string().max(200).optional(),
        startDate: z.string().datetime().or(z.date()).optional(),
        endDate: z.string().datetime().or(z.date()).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        status: z
            .enum(["not started", "in progress", "completed", "closed"])
            .optional(),
        assignedTo: z.array(objectIdSchema).optional(),
        comments: z.array(commentSchema).optional(),
        refFiles: z.array(refFileSchema).optional(),
        progressFields: z.array(progressFieldSchema).optional(),
    }).refine(
        (data) => {
            if (data.startDate && data.endDate) {
                return new Date(data.startDate) <= new Date(data.endDate);
            }
            return true;
        },
        {
            message: "End date must be after start date",
            path: ["endDate"],
        }
    ),
});

export const getTaskByIdSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
});

export const addCommentSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
    body: z.object({
        text: z.string().min(1).max(1000),
    }),
});

export const addRefFileSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
    body: z.object({
        url: z.string().url(),
        name: z.string().min(1).max(255),
    }),
});

export const addProgressFieldSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
    body: z.object({
        title: z.string().min(1).max(100),
        value: z.string().max(500),
    }),
});

export const deleteTaskSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
});
