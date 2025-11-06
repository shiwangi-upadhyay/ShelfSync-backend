// routes/memberRequestRoutes.ts
import express from "express";
import MemberRequestController from "../controllers/memberRequestController";
import {
    requireAuth,
    requireProjectOwner,
    requireMemberRequestApproval,
} from "../middleware/auth";
import { validate } from "../middleware/validationMiddleware";
import { memberRequestZod } from "../zod";



const router = express.Router();

// All member request routes require authentication
router.use(requireAuth);

// Create request - Project Owner only
router.post(
    "/",
    requireProjectOwner,
    validate(memberRequestZod.createMemberRequestSchema),
    MemberRequestController.createMemberRequest
);

// Get my requests
router.get(
    "/my-requests",
    requireProjectOwner,
    MemberRequestController.getMyRequests
);

// Get pending approvals
router.get(
    "/pending-approvals",
    requireProjectOwner,
    MemberRequestController.getPendingApprovals
);

// Get specific request
router.get(
    "/:id",
    validate(memberRequestZod.getMemberRequestByIdSchema),
    MemberRequestController.getRequestById
);

// Approve request - Only current project owner can approve
router.post(
    "/:id/approve",
    validate(memberRequestZod.approveRequestSchema),
    requireMemberRequestApproval,
    MemberRequestController.approveRequest
);

// Reject request - Only current project owner can reject
router.post(
    "/:id/reject",
    validate(memberRequestZod.rejectRequestSchema),
    requireMemberRequestApproval,
    MemberRequestController.rejectRequest
);

// Cancel request - Requesting project owner can cancel
router.delete(
    "/:id/cancel",
    validate(memberRequestZod.cancelRequestSchema),
    MemberRequestController.cancelRequest
);

export default router;
