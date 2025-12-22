import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/services/db';
import { Project, Task, TeamMember, Transaction } from '@/types';

// Query Keys
export const queryKeys = {
    projects: ['projects'] as const,
    project: (id: string) => ['projects', id] as const,
    tasks: ['tasks'] as const,
    task: (id: string) => ['tasks', id] as const,
    teamMembers: ['teamMembers'] as const,
    transactions: ['transactions'] as const,
    companies: ['companies'] as const,
};

// Projects Hooks
export const useProjects = () => {
    return useQuery({
        queryKey: queryKeys.projects,
        queryFn: async () => {
            const response = await db.getProjects();
            return response as Project[];
        },
    });
};

export const useProject = (id: string | null) => {
    return useQuery({
        queryKey: queryKeys.project(id || ''),
        queryFn: async () => {
            if (!id) return null;
            const response = await db.getProject(id);
            return response as Project;
        },
        enabled: !!id,
    });
};

// Tasks Hooks
export const useTasks = () => {
    return useQuery({
        queryKey: queryKeys.tasks,
        queryFn: async () => {
            const response = await db.getTasks();
            return response as Task[];
        },
    });
};

// Team Members Hooks
export const useTeamMembers = () => {
    return useQuery({
        queryKey: queryKeys.teamMembers,
        queryFn: async () => {
            const response = await db.getTeamMembers();
            return response as TeamMember[];
        },
    });
};

// Transactions Hooks
export const useTransactions = () => {
    return useQuery({
        queryKey: queryKeys.transactions,
        queryFn: async () => {
            const response = await db.getTransactions();
            return response as Transaction[];
        },
    });
};

// Mutation Hooks
export const useCreateProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (project: Partial<Project>) => {
            return await db.addProject(project);
        },
        onSuccess: () => {
            // Invalidate and refetch projects
            queryClient.invalidateQueries({ queryKey: queryKeys.projects });
        },
    });
};

export const useUpdateProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
            return await db.updateProject(id, updates);
        },
        onSuccess: (_, variables) => {
            // Invalidate specific project and projects list
            queryClient.invalidateQueries({ queryKey: queryKeys.project(variables.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.projects });
        },
    });
};

export const useCreateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (task: Partial<Task>) => {
            return await db.addTask(task);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
        },
    });
};

export const useCreateTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (transaction: Partial<Transaction>) => {
            return await db.addTransaction(transaction);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
        },
    });
};
