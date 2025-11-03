
import Project, { IProject, IProjectMember } from "../../models/project";
import User from "../../models/user";
import mongoose from "mongoose";

export class ProjectService {
    static async createProject(data: {
        name: string;
        description?: string;
        department: string;
        projectOwner: string;
        createdBy: string;
    }): Promise<IProject> {
        const project = new Project({
            name: data.name,
            description: data.description,
            department: new mongoose.Types.ObjectId(data.department),
            projectOwner: new mongoose.Types.ObjectId(data.projectOwner),
            createdBy: new mongoose.Types.ObjectId(data.createdBy),
            members: [],
            teams: [],
        });

        // Update user role to project_owner if not already
        await User.findByIdAndUpdate(data.projectOwner, {
            $set: { role: "project_owner" },
            $addToSet: { projects: project._id },
        });

        return await project.save();
    }

    static async findAll(): Promise<IProject[]> {
        return await Project.find()
            .populate("department", "name")
            .populate("projectOwner", "name email")
            .populate("createdBy", "name email")
            .populate("members.user", "name email memberType")
            .populate("teams", "name")
            .sort({ createdAt: -1 });
    }

    static async findById(id: string): Promise<IProject | null> {
        return await Project.findById(id)
            .populate("department", "name")
            .populate("projectOwner", "name email")
            .populate("createdBy", "name email")
            .populate("members.user", "name email memberType activeProjectCount")
            .populate("teams", "name members");
    }

    static async findByOwner(ownerId: string): Promise<IProject[]> {
        return await Project.find({ projectOwner: ownerId })
            .populate("department", "name")
            .populate("members.user", "name email memberType")
            .populate("teams", "name")
            .sort({ createdAt: -1 });
    }

    static async findByDepartment(departmentId: string): Promise<IProject[]> {
        return await Project.find({ department: departmentId })
            .populate("projectOwner", "name email")
            .populate("members.user", "name email")
            .sort({ createdAt: -1 });
    }

    static async update(
        id: string,
        data: Partial<IProject>
    ): Promise<IProject | null> {
        return await Project.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
        )
            .populate("department", "name")
            .populate("projectOwner", "name email")
            .populate("members.user", "name email");
    }

    static async addMember(
        projectId: string,
        userId: string,
        memberType: "dedicated" | "shared"
    ): Promise<IProject | null> {
        const project = await Project.findById(projectId);
        if (!project) return null;

        // Check if member already exists
        const existingMember = project.members.find(
            (m) => m.user.toString() === userId
        );

        if (existingMember) {
            throw new Error("Member already exists in this project");
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        // Validate shared member capacity
        if (memberType === "shared" && user.memberType === "shared") {
            if (user.activeProjectCount && user.activeProjectCount >= 2) {
                throw new Error("Shared member is already at maximum capacity (2 projects)");
            }
        }

        // Add member to project
        const newMember: IProjectMember = {
            user: new mongoose.Types.ObjectId(userId),
            memberType,
            assignedDate: new Date(),
            projectCount: 1,
        };

        project.members.push(newMember);
        await project.save();

        // Update user's project list and count
        await User.findByIdAndUpdate(userId, {
            $addToSet: { projects: projectId },
            $set: { memberType },
            $inc: { activeProjectCount: 1 },
        });

        return await this.findById(projectId);
    }

    static async removeMember(
        projectId: string,
        userId: string
    ): Promise<IProject | null> {
        const project = await Project.findByIdAndUpdate(
            projectId,
            {
                $pull: { members: { user: userId } },
            },
            { new: true }
        );

        if (!project) return null;

        // Update user's project list and count
        await User.findByIdAndUpdate(userId, {
            $pull: { projects: projectId },
            $inc: { activeProjectCount: -1 },
        });

        return await this.findById(projectId);
    }

    static async addTeam(projectId: string, teamId: string): Promise<IProject | null> {
        return await Project.findByIdAndUpdate(
            projectId,
            { $addToSet: { teams: teamId } },
            { new: true }
        ).populate("teams", "name members");
    }

    static async removeTeam(projectId: string, teamId: string): Promise<IProject | null> {
        return await Project.findByIdAndUpdate(
            projectId,
            { $pull: { teams: teamId } },
            { new: true }
        ).populate("teams", "name");
    }

    static async delete(id: string): Promise<boolean> {
        const project = await Project.findById(id);
        if (!project) return false;

        // Remove project from all members
        await User.updateMany(
            { projects: id },
            {
                $pull: { projects: id },
                $inc: { activeProjectCount: -1 },
            }
        );

        const result = await Project.findByIdAndDelete(id);
        return !!result;
    }

    static async getMembersByProject(projectId: string): Promise<IProjectMember[]> {
        const project = await Project.findById(projectId).populate(
            "members.user",
            "name email memberType activeProjectCount"
        );

        return project ? project.members : [];
    }

    static async count(): Promise<number> {
        return await Project.countDocuments();
    }

    static async countByDepartment(departmentId: string): Promise<number> {
        return await Project.countDocuments({ department: departmentId });
    }
}
