// services/dbServices/departmentService.ts
import mongoose from "mongoose";
import Department, { IDepartment } from "../../models/department";

export class DepartmentService {
    static async createDepartment(data: {
        name: string;
        description?: string;
        createdBy: string;
    }): Promise<IDepartment> {
        const department = new Department({
            name: data.name,
            description: data.description,
            createdBy: new mongoose.Types.ObjectId(data.createdBy),
        });

        return await department.save();
    }

    static async findAll(): Promise<IDepartment[]> {
        return await Department.find()
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });
    }

    static async findById(id: string): Promise<IDepartment | null> {
        return await Department.findById(id)
            .populate("createdBy", "name email");
    }

    static async findByName(name: string): Promise<IDepartment | null> {
        return await Department.findOne({ name });
    }

    static async update(
        id: string,
        data: Partial<IDepartment>
    ): Promise<IDepartment | null> {
        return await Department.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
        ).populate("createdBy", "name email");
    }

    static async delete(id: string): Promise<boolean> {
        const result = await Department.findByIdAndDelete(id);
        return !!result;
    }

    static async search(
        query: string,
        page: number = 1,
        limit: number = 10
    ): Promise<IDepartment[]> {
        const skip = (page - 1) * limit;

        return await Department.find({
            $or: [
                { name: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
            ],
        })
            .populate("createdBy", "name email")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
    }

    static async count(): Promise<number> {
        return await Department.countDocuments();
    }
}
