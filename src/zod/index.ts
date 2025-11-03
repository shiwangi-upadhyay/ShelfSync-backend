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

export default {
    projectZod,
    departmentZod
}