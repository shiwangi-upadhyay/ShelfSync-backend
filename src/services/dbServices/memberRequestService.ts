// services/dbServices/memberRequestService.ts
import MemberRequest, { IMemberRequest } from "../../models/request";
import { ProjectService } from "./projectService";
import { UserService } from "./userService";
import mongoose from "mongoose";

export class MemberRequestService {
    static async createRequest(data: {
        requestingProject: string;
        requestingProjectOwner: string;
        requestedMember: string;
        currentProject: string;
        currentProjectOwner: string;
        requestType: "dedicated" | "shared";
        reason?: string;
    }): Promise<IMemberRequest> {
        const request = new MemberRequest({
            requestingProject: new mongoose.Types.ObjectId(data.requestingProject),
            requestingProjectOwner: new mongoose.Types.ObjectId(data.requestingProjectOwner),
            requestedMember: new mongoose.Types.ObjectId(data.requestedMember),
            currentProject: new mongoose.Types.ObjectId(data.currentProject),
            currentProjectOwner: new mongoose.Types.ObjectId(data.currentProjectOwner),
            requestType: data.requestType,
            reason: data.reason,
            status: "pending",
        });

        return await request.save();
    }

    static async findAll(): Promise<IMemberRequest[]> {
        return await MemberRequest.find()
            .populate("requestingProject", "name")
            .populate("requestingProjectOwner", "name email")
            .populate("requestedMember", "name email memberType activeProjectCount")
            .populate("currentProject", "name")
            .populate("currentProjectOwner", "name email")
            .populate("approvedBy", "name email")
            .sort({ createdAt: -1 });
    }

    static async findById(id: string): Promise<IMemberRequest | null> {
        return await MemberRequest.findById(id)
            .populate("requestingProject", "name")
            .populate("requestingProjectOwner", "name email")
            .populate("requestedMember", "name email memberType activeProjectCount")
            .populate("currentProject", "name")
            .populate("currentProjectOwner", "name email")
            .populate("approvedBy", "name email");
    }

    static async findByUser(userId: string): Promise<IMemberRequest[]> {
        return await MemberRequest.find({
            $or: [
                { requestingProjectOwner: userId },
                { currentProjectOwner: userId },
            ],
        })
            .populate("requestingProject", "name")
            .populate("requestingProjectOwner", "name email")
            .populate("requestedMember", "name email memberType")
            .populate("currentProject", "name")
            .populate("currentProjectOwner", "name email")
            .sort({ createdAt: -1 });
    }

    static async findPendingForApprover(userId: string): Promise<IMemberRequest[]> {
        return await MemberRequest.find({
            currentProjectOwner: userId,
            status: "pending",
        })
            .populate("requestingProject", "name")
            .populate("requestingProjectOwner", "name email")
            .populate("requestedMember", "name email memberType activeProjectCount")
            .populate("currentProject", "name")
            .sort({ createdAt: -1 });
    }

    static async findByProject(projectId: string): Promise<IMemberRequest[]> {
        return await MemberRequest.find({
            $or: [{ requestingProject: projectId }, { currentProject: projectId }],
        })
            .populate("requestingProject", "name")
            .populate("requestedMember", "name email memberType")
            .populate("currentProject", "name")
            .sort({ createdAt: -1 });
    }

    static async approveRequest(
        requestId: string,
        approverId: string
    ): Promise<IMemberRequest | null> {
        const request = await MemberRequest.findById(requestId);

        if (!request) {
            throw new Error("Request not found");
        }

        if (request.status !== "pending") {
            throw new Error(`Request is already ${request.status}`);
        }

        // Update request status
        request.status = "approved";
        request.approvedBy = new mongoose.Types.ObjectId(approverId);
        request.approvalDate = new Date();
        await request.save();

        // Add member to the requesting project
        await ProjectService.addMember(
            request.requestingProject.toString(),
            request.requestedMember.toString(),
            request.requestType
        );

        // If dedicated member, remove from current project
        if (request.requestType === "dedicated") {
            await ProjectService.removeMember(
                request.currentProject.toString(),
                request.requestedMember.toString()
            );
        }

        return await this.findById(requestId);
    }

    static async rejectRequest(
        requestId: string,
        rejectionReason?: string
    ): Promise<IMemberRequest | null> {
        const request = await MemberRequest.findByIdAndUpdate(
            requestId,
            {
                $set: {
                    status: "rejected",
                    rejectionReason,
                },
            },
            { new: true }
        )
            .populate("requestingProject", "name")
            .populate("requestingProjectOwner", "name email")
            .populate("requestedMember", "name email")
            .populate("currentProject", "name");

        return request;
    }

    static async delete(id: string): Promise<boolean> {
        const result = await MemberRequest.findByIdAndDelete(id);
        return !!result;
    }

    static async getPendingCount(userId: string): Promise<number> {
        return await MemberRequest.countDocuments({
            currentProjectOwner: userId,
            status: "pending",
        });
    }

    static async getRequestsByStatus(
        status: "pending" | "approved" | "rejected"
    ): Promise<IMemberRequest[]> {
        return await MemberRequest.find({ status })
            .populate("requestingProject", "name")
            .populate("requestedMember", "name email")
            .populate("currentProject", "name")
            .sort({ createdAt: -1 });
    }
}
