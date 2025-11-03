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

import {
    createTeamSchema,
    updateTeamSchema,
    getTeamByIdSchema,
    getTeamsByProjectSchema,
    addMemberToTeamSchema,
    removeMemberFromTeamSchema,
    deleteTeamSchema
} from "./team"





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

export const teamZod = {
    createTeamSchema,
    updateTeamSchema,
    getTeamByIdSchema,
    getTeamsByProjectSchema,
    addMemberToTeamSchema,
    removeMemberFromTeamSchema,
    deleteTeamSchema
}

export default {
    projectZod,
    departmentZod,
    memberRequestZod,
    teamZod
}