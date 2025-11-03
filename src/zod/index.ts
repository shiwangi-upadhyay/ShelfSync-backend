import {
    createProjectSchema,
    updateProjectSchema,
    getProjectByIdSchema,
    getProjectsByDepartmentSchema,
    addMemberToProjectSchema,
    removeMemberFromProjectSchema,
    deleteProjectSchema,
} from "./project";

import {
    createDepartmentSchema,
    updateDepartmentSchema,
    getDepartmentByIdSchema,
    deleteDepartmentSchema,
} from "./department";

import { createMemberRequestSchema, getMemberRequestByIdSchema, approveRequestSchema, rejectRequestSchema, cancelRequestSchema } from "./memberRequest"





export const projectZod = {
    createProjectSchema,
    updateProjectSchema,
    getProjectByIdSchema,
    getProjectsByDepartmentSchema,
    addMemberToProjectSchema,
    removeMemberFromProjectSchema,
    deleteProjectSchema,
}

export const departmentZod = {
    createDepartmentSchema,
    updateDepartmentSchema,
    getDepartmentByIdSchema,
    deleteDepartmentSchema,
}

export const memberRequestZod = {
    createMemberRequestSchema,
    getMemberRequestByIdSchema,
    approveRequestSchema,
    rejectRequestSchema,
    cancelRequestSchema
}

export default {
    projectZod,
    departmentZod,
    memberRequestZod
}