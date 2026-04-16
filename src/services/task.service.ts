import { apiClient } from "@/lib/api-client";
import { SPRINT_STATUS, SprintStatus } from "./sprint.service";
import { SUBJECT_STATUS, SubjectStatus } from "./subject.service";
import { SyllabusStatus } from "./syllabus.service";

export const TASK_STATUS = {
    DRAFT: 'DRAFT',
    TO_DO: 'TO_DO',
    IN_PROGRESS: 'IN_PROGRESS',
    DONE: 'DONE',
    REVISION_REQUESTED: 'REVISION_REQUESTED',
    CANCELLED: 'CANCELLED',
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export const TASK_TYPE = {
  NEW_SUBJECT: "NEW_SUBJECT",
  REUSED_SUBJECT: "REUSED_SUBJECT",
  UPDATED_SUBJECT: "UPDATED_SUBJECT",
  SYLLABUS_DEVELOP: "SYLLABUS_DEVELOP",
} as const;

export type TaskType = (typeof TASK_TYPE)[keyof typeof TASK_TYPE];

export interface CurriculumTask {
  curriculumId: string;
  status: TaskStatus;
  curriculum_code: string;
  curriculum_name: string;
  start_year: number;
}

export interface TaskResponse {
  status: number;
  message: string;
  data: CurriculumTask[];
}

export interface Sprint {
  sprintId: string;
  sprintName: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  createdAt: string;
  accountId: string; // Creator (HoCFDC)
  curriculumId?: string;
  goal?: string;
}

export interface SubjectTaskDetail {
  code: string;
  name: string;
  status: SubjectStatus;
  weight?: number; // Credits or complexity
}

export interface TaskItem {
  taskId: string;
  sprintId: string;
  subjectId?: string;
  subjectStatus?: SubjectStatus;
  account: {
    accountId: string;
    email?: string;
    fullName: string;
  };
  syllabus: {
    syllabusId: string;
    syllabusName: string;
    status?: SyllabusStatus;
  };
  curriculumId?: string | null;
  taskName: string;
  description: string;
  status: TaskStatus;
  priority: string;
  type: string;
  deadline: string;
  completedAt?: string | null;
  createdAt: string;
  subjectsCount?: number;
  tags?: string[];
  subjectsDetail?: SubjectTaskDetail[];
  progress?: number;
  syllabusStatus?: string | null;
}

export interface TaskApiItem {
  taskId: string;
  sprintId: string;
  subjectId?: string;
  subjectStatus?: SubjectStatus;
  accountId?: string;
  account?: {
    accountId?: string;
    fullName?: string;
    email?: string;
  };
  syllabusId?: string;
  syllabus?: {
    syllabusId?: string;
    syllabusName?: string;
    subjectId?: string;
    subjectCode?: string;
    subjectName?: string;
    status?: string;
  };
  curriculumId?: string | null;
  taskName: string;
  description: string;
  status: TaskStatus;
  priority: string;
  type: string;
  deadline: string;
  completedAt?: string | null;
  createdAt: string;
}

type TaskPageApiItem = {
  content?: TaskApiItem[];
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
};

export interface TasksPaginatedResponse {
  status: number;
  message: string;
  data: {
    content: TaskItem[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface TaskQueryParams {
  search?: string;
  status?: TaskStatus;
  sprintId?: string;
  accountId?: string;
  departmentId?: string;
  syllabusId?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: "asc" | "desc";
}

export interface CreateTaskPayload {
  sprintId: string;
  subjectId?: string;
  syllabusId?: string;
  accountId?: string;
  curriculumId?: string;
  taskName: string;
  description: string;
  priority: string | null;
  type: string;
  deadline?: string;
  createdAt?: string;
}

export interface UpdateTaskPayload {
  accountId: string;
  syllabusId: string;
  taskName: string;
  description: string;
  priority: string;
  type: string;
  deadline: string;
}

export interface BatchTaskPayload {
  tasks: CreateTaskPayload[];
}

// Helper to calculate progress
const calculateProgress = (subjects: SubjectTaskDetail[]): number => {
  if (!subjects.length) return 0;
  const readyCount = subjects.filter(
    (s) => s?.status === SUBJECT_STATUS.COMPLETED,
  ).length;
  return Math.round((readyCount / subjects.length) * 100);
};

export const TaskService = {
  getTasks: async (params?: TaskQueryParams) => {
    // If multiple statuses are provided, we map them into parallel requests.
    if (Array.isArray(params?.status)) {
        const results = await Promise.all(params.status.map(async (s) => {
            const singleParams = { ...params, status: s };
            return await TaskService.getTasks(singleParams);
        }));

        // Merge results similarly to review-tasks
        const combinedContent = results.flatMap(r => r?.data?.content || []);
        const firstResult = results[0];

        if (!firstResult) return { status: 200, message: "No data", data: { content: [], totalElements: 0, totalPages: 1, page: 0, size: params.size || 10 } };
        
        return {
            ...firstResult,
            data: {
                ...firstResult.data,
                content: combinedContent,
                totalElements: results.reduce((acc, r) => acc + (r?.data?.totalElements || 0), 0),
                totalPages: Math.max(1, ...results.map(r => r?.data?.totalPages || 1))
            }
        };
    }

    const queryParams = new URLSearchParams();

    // Default values from Swagger
    const page = params?.page ?? 0;
    const size = params?.size ?? 10;
    const sortBy = params?.sortBy ?? "deadline";
    const direction = params?.direction ?? "asc";

    queryParams.append("page", page.toString());
    queryParams.append("size", size.toString());
    queryParams.append("sortBy", sortBy);
    queryParams.append("direction", direction);

    if (params?.search) queryParams.append("search", params.search);
    if (params?.status && typeof params.status === 'string') queryParams.append("status", params.status);
    if (params?.sprintId) queryParams.append("sprintId", params.sprintId);
    if (params?.accountId) queryParams.append("accountId", params.accountId);
    if (params?.departmentId)
      queryParams.append("departmentId", params.departmentId);
    if (params?.syllabusId) queryParams.append("syllabusId", params.syllabusId);

    const response = await apiClient.get<TasksPaginatedResponse>(
          `/api/tasks?${queryParams.toString()}`,
          { credentials: "include" },
      );

    return response;
  },

  mapTaskApiToItem: (task: any): TaskItem => ({
    taskId: task.taskId,
    sprintId: task.sprintId,
    subjectId: task.subjectId || task.syllabus?.subjectId,
    subjectStatus: task.subjectStatus,
    account: {
      accountId: task.account?.accountId || task.accountId || "",
      email: task.account?.email || "",
      fullName: task.account?.fullName || task.fullName || "Unassigned",
    },
    syllabus: {
      syllabusId: task.syllabus?.syllabusId || task.syllabusId || "",
      syllabusName: task.syllabus?.syllabusName || task.syllabusName || "Unnamed Syllabus",
    },
    curriculumId: task.curriculumId ?? null,
    taskName: task.taskName,
    description: task.description,
    status: task.status,
    priority: task.priority,
    type: task.type,
    deadline: task.deadline,
    completedAt: task.completedAt ?? null,
    createdAt: task.createdAt,
    syllabusStatus: task.syllabus?.status || null,
  }),

  getTaskById: async (taskId: string) => {
    return apiClient.get<{ status: number; message: string; data: TaskItem }>(
            `/api/tasks/${taskId}`,
        );
  },

  getTaskByAccountId: async (id: string, status?: TaskStatus) => {
    const queryParams = new URLSearchParams({ accountId: id });
    if (status) queryParams.append("status", status);
    return apiClient.get<TaskResponse>(
      `/api/tasks/curriculums?${queryParams.toString()}`,
    );
  },

  createTask: async (payload: CreateTaskPayload) => {
    return apiClient.post<{
      status: number;
      message: string;
      data?: TaskApiItem;
    }>("/api/tasks", payload, {
      credentials: "include",
    });
  },

  createBatchTasks: async (sprintId: string, payload?: BatchTaskPayload) => {
    return apiClient.post<{ status: number; message: string; data?: unknown }>(
      `/api/tasks/batch/${sprintId}`,
      payload || {},
      {
        credentials: "include",
      },
    );
  },

  getTasksBySprintIdAndDepartmentId: async (
    sprintId: string,
    departmentId: string,
    accountId?: string,
  ) => {
    const response = await TaskService.getTasks({
      sprintId,
      departmentId,
      accountId,
      size: 100,
      sortBy: "deadline",
      direction: "asc",
    });

    const responseRecord = response.data as { data?: TaskPageApiItem };
    const payload = responseRecord?.data ?? (response.data as TaskPageApiItem);
    const rawContent = Array.isArray(payload?.content) ? payload.content : [];
    const content = rawContent.map(TaskService.mapTaskApiToItem);

    return {
      ...response,
      data: {
        content,
        page: payload?.page ?? 0,
        size: payload?.size ?? 10,
        totalElements: payload?.totalElements ?? content.length,
        totalPages: payload?.totalPages ?? 1,
      },
    };
  },

  getTasksBySprintId: async (sprintId: string, accountId?: string) => {
    const response = await TaskService.getTasks({
      sprintId,
      accountId,
      size: 100,
      sortBy: "deadline",
      direction: "asc",
    });

    const responseRecord = response.data as { data?: TaskPageApiItem };
    const payload = responseRecord?.data ?? (response.data as TaskPageApiItem);
    const rawContent = Array.isArray(payload?.content) ? payload.content : [];
    const content = rawContent.map(TaskService.mapTaskApiToItem);

    return {
      ...response,
      data: {
        content,
        page: payload?.page ?? 0,
        size: payload?.size ?? 10,
        totalElements: payload?.totalElements ?? content.length,
        totalPages: payload?.totalPages ?? 1,
      },
    };
  },

  updateTaskStatus: async (taskId: string, status: TaskStatus, accountId: string = "") => {
    return apiClient.patch<{ status: number; message: string; data?: unknown }>(
      `/api/tasks/${taskId}/status?status=${status}`,
      {},
      { credentials: "include" }
    );
  },

  deleteTask: async (taskId: string) => {
    return apiClient.delete<{ status: number; message: string }>(
      `/api/tasks/${taskId}`,
      {
        credentials: "include",
      },
    );
  },

  updateTask: async (taskId: string, payload: UpdateTaskPayload) => {
    return apiClient.put<{
      status: number;
      message: string;
      data?: TaskApiItem;
    }>(`/api/tasks/${taskId}`, payload, {
      credentials: "include",
    });
  },
};
