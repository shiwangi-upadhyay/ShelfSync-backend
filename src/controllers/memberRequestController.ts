// memberRequestController.ts
import { Request, Response } from "express";
import { MemberRequestService } from "../services/dbServices/memberRequestService";
import { ProjectService } from "../services/dbServices/projectService";
import { UserService } from "../services/dbServices/userService";
import mongoose from "mongoose";

export default class MemberRequestController {
    // Project Owner creates a request for a member from another project
    static async createMemberRequest(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            const {
                requestingProject,
                requestedMember,
                requestType,
                reason
            } = req.body;

            if (!requestingProject || !requestedMember || !requestType) {
                return res.status(400).json({
                    error: "Requesting project, requested member, and request type are required"
                });
            }

            if (!["dedicated", "shared"].includes(requestType)) {
                return res.status(400).json({
                    error: "Request type must be 'dedicated' or 'shared'"
                });
            }

            // Verify requesting user is the project owner
            const project = await ProjectService.findById(requestingProject);

            if (!project) {
                return res.status(404).json({ error: "Requesting project not found" });
            }

            if (project.projectOwner.toString() !== userId) {
                return res.status(403).json({
                    error: "Forbidden: Only Project Owner can request members"
                });
            }

            // Find member's current project
            const member = await UserService.findById(requestedMember);

            if (!member) {
                return res.status(404).json({ error: "Requested member not found" });
            }

            if (!member.projects || member.projects.length === 0) {
                return res.status(400).json({
                    error: "Member is not assigned to any project"
                });
            }

            // Validate shared member capacity
            if (requestType === "shared" && member.memberType === "shared") {
                if (member.activeProjectCount && member.activeProjectCount >= 2) {
                    return res.status(400).json({
                        error: "Shared member is already at maximum capacity (2 projects)"
                    });
                }
            }

            // Get member's current project (use first project for now)
            const currentProjectId = member.projects[0];
            const currentProject = await ProjectService.findById(
                currentProjectId.toString()
            );

            if (!currentProject) {
                return res.status(404).json({
                    error: "Member's current project not found"
                });
            }

            const memberRequest = await MemberRequestService.createRequest({
                requestingProject,
                requestingProjectOwner: userId,
                requestedMember,
                currentProject: String(currentProjectId),
                currentProjectOwner: String(currentProject.projectOwner),
                requestType,
                reason
            });

            res.status(201).json(memberRequest);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    // Get all requests for current user (as requesting or approving owner)
    static async getMyRequests(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                return res.status(400).json({ error: "User ID is required" });
            }

            const requests = await MemberRequestService.findByUser(userId);
            res.json(requests);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }

    // Get pending requests where current user is the approver
    static async getPendingApprovals(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                return res.status(400).json({ error: "User ID is required" });
            }

            const requests = await MemberRequestService.findPendingForApprover(userId);
            res.json(requests);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }

    static async getRequestById(req: Request, res: Response) {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid request ID" });
        }

        try {
            const request = await MemberRequestService.findById(id);

            if (!request) {
                return res.status(404).json({ error: "Request not found" });
            }

            res.json(request);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }

    // Approve member request (only current project owner can approve)
    static async approveRequest(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            const requestId = req.params.id;

            const request = await MemberRequestService.findById(requestId);

            if (!request) {
                return res.status(404).json({ error: "Request not found" });
            }

            if (request.currentProjectOwner.toString() !== userId) {
                return res.status(403).json({
                    error: "Forbidden: Only the current project owner can approve this request"
                });
            }

            if (request.status !== "pending") {
                return res.status(400).json({
                    error: `Request is already ${request.status}`
                });
            }

            const approvedRequest = await MemberRequestService.approveRequest(
                requestId,
                userId
            );

            res.json(approvedRequest);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    // Reject member request (only current project owner can reject)
    static async rejectRequest(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            const requestId = req.params.id;
            const { rejectionReason } = req.body;

            const request = await MemberRequestService.findById(requestId);

            if (!request) {
                return res.status(404).json({ error: "Request not found" });
            }

            if (request.currentProjectOwner.toString() !== userId) {
                return res.status(403).json({
                    error: "Forbidden: Only the current project owner can reject this request"
                });
            }

            if (request.status !== "pending") {
                return res.status(400).json({
                    error: `Request is already ${request.status}`
                });
            }

            const rejectedRequest = await MemberRequestService.rejectRequest(
                requestId,
                rejectionReason
            );

            res.json(rejectedRequest);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    // Cancel request (only requesting project owner can cancel)
    static async cancelRequest(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            const requestId = req.params.id;

            const request = await MemberRequestService.findById(requestId);

            if (!request) {
                return res.status(404).json({ error: "Request not found" });
            }

            if (request.requestingProjectOwner.toString() !== userId) {
                return res.status(403).json({
                    error: "Forbidden: Only the requesting project owner can cancel this request"
                });
            }

            if (request.status !== "pending") {
                return res.status(400).json({
                    error: `Cannot cancel request that is already ${request.status}`
                });
            }

            const success = await MemberRequestService.delete(requestId);

            if (!success) {
                return res.status(404).json({ error: "Request not found" });
            }

            res.json({ message: "Request cancelled successfully" });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }
}
