import User from "../../models/user";
import Otp from "../../models/otp";
import bcrypt from "bcrypt";

export class UserService {
  static async findAll() {
    return await User.find({}, { passwordHash: 0 });
  }

  //   static async searchByNameOrEmail(query: string, limit = 10) {
  //   if (!query) {
  //     console.log("[UserService.searchByNameOrEmail] Empty query, returning []");
  //     return [];
  //   }
  //   const safeQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  //   console.log("[UserService.searchByNameOrEmail] Searching with safeQuery:", safeQuery);

  //   const result = await User.find({
  //     $or: [
  //       { name: { $regex: safeQuery, $options: "i" } },
  //       { email: { $regex: safeQuery, $options: "i" } }
  //     ]
  //   }, { passwordHash: 0 }).limit(limit);

  //   console.log("[UserService.searchByNameOrEmail] Result count:", result.length);
  //   return result;
  // }

  static async searchByNameOrEmail(query: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    if (!query) {
      return User.find({}, { passwordHash: 0 }).skip(skip).limit(limit);
    }
    const safeQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    return User.find(
      {
        $or: [
          { name: { $regex: safeQuery, $options: "i" } },
          { email: { $regex: safeQuery, $options: "i" } },
        ],
      },
      { passwordHash: 0 }
    )
      .skip(skip)
      .limit(limit);
  }
  static async findById(userId: string) {
    return await User.findById(userId, { passwordHash: 0 });
  }
  static async findByEmail(email: string) {
    return await User.findOne({ email });
  }
  static async createUser({
    name,
    email,
    passwordHash,
    role = "member",
  }: {
    name: string;
    email: string;
    passwordHash: string;
    role?: string;
  }) {
    const user = new User({ name, email, passwordHash, role });
    return await user.save();
  }
  static async update(
    userId: string,
    userData: Partial<{
      name: string;
      email: string;
      passwordHash: string;
      role: string;
    }>
  ) {
    return await User.findByIdAndUpdate(userId, userData, {
      new: true,
      fields: { passwordHash: 0 },
    });
  }
  static async delete(userId: string) {
    const result = await User.findByIdAndDelete(userId);
    return !!result;
  }

  static async createOtp(email: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    await Otp.create({ email, otp, expiresAt });
    // TODO: Send OTP via email here!
    return otp;
  }

  static async verifyOtp(email: string, otp: string): Promise<boolean> {
    const record = await Otp.findOne({ email, otp });
    if (!record || record.expiresAt < new Date()) return false;
    return true;
  }

  static async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<boolean> {
    const valid = await UserService.verifyOtp(email, otp);
    if (!valid) return false;
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { passwordHash });
    await Otp.deleteMany({ email }); // Remove used OTPs
    return true;
  }


  static async addProject(userId: string, projectId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { projects: projectId },
      $inc: { activeProjectCount: 1 },
    });
  }

  static async removeProject(userId: string, projectId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { projects: projectId },
      $inc: { activeProjectCount: -1 },
    });
  }

  static async addTeam(userId: string, teamId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { teams: teamId },
    });
  }

  static async removeTeam(userId: string, teamId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { teams: teamId },
    });
  }

  static async findByRole(role: string): Promise<any[]> {
    return await User.find({ role }, { passwordHash: 0 })
      .populate("projects", "name")
      .sort({ name: 1 });
  }

  static async findAvailableSharedMembers(): Promise<any[]> {
    return await User.find(
      {
        memberType: "shared",
        activeProjectCount: { $lt: 2 },
      },
      { passwordHash: 0 }
    ).populate("projects", "name");
  }

  static async findDedicatedMembers(): Promise<any[]> {
    return await User.find(
      {
        memberType: "dedicated",
      },
      { passwordHash: 0 }
    ).populate("projects", "name");
  }

  static async countByRole(role: string): Promise<number> {
    return await User.countDocuments({ role });
  }

  static async updatePassword(
    id: string,
    passwordHash: string
  ): Promise<any | null> {
    return await User.findByIdAndUpdate(
      id,
      { $set: { passwordHash } },
      { new: true }
    ).select("-passwordHash");
  }
}
