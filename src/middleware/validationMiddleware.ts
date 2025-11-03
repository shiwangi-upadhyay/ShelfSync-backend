// middleware/validationMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

export const validate = (schema: ZodObject) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.issues.map((issue: any) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                }));

                return res.status(400).json({
                    error: "Validation failed",
                    details: errorMessages,
                });
            }

            return res.status(500).json({
                error: "Internal server error during validation",
            });
        }
    };
};
