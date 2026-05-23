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
  subject?: {
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    credits: number;
    status: string;
    sources?: Array<{
      sourceId: string;
      sourceCode: string;
      sourceName: string;
      type: string;
      author: string;
      publisher: string;
      publishedYear: number;
      url: string;
    }>;
    departmentCode?: string;
    departmentName?: string;
  };
  account: {
    accountId: string;
    email?: string;
    fullName: string;
  };
  syllabusId?: string;
  syllabus?: {
    syllabusId: string;
    syllabusName: string;
    status?: SyllabusStatus;
  };
  curriculumId?: string | null;
  majorId?: string | null;
  major?: { majorId: string; majorCode: string; majorName: string; } | null;
  taskName: string;
  description: string;
  status: TaskStatus;
  priority: string;
  type: string;
  action?: string;
  deadline: string;
  document?: {
    documentId: string;
    documentUrl: string;
    majorId?: string;
  };
  createdBy?: {
    accountId: string;
    email: string;
    fullName: string;
  };
  completedAt?: string | null;
  targetId?: string | null;
  rootTaskId?: string | null;
  createdAt: string;
  subjectsCount?: number;
  tags?: string[];
  subjectsDetail?: SubjectTaskDetail[];
  progress?: number;
  syllabusStatus?: string | null;
  isAccepted?: boolean | null;
  comment?: string | null;
}

export interface TaskApiItem {
  taskId: string;
  sprintId: string;
  subjectId?: string;
  subjectStatus?: SubjectStatus;
  subject?: {
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    credits: number;
    status: string;
    sources?: Array<{
      sourceId: string;
      sourceCode: string;
      sourceName: string;
      type: string;
      author: string;
      publisher: string;
      publishedYear: number;
      url: string;
    }>;
    departmentCode?: string;
    departmentName?: string;
  };
  accountId?: string;
  account?: {
    accountId?: string;
    fullName?: string;
    email?: string;
  };
  assignTo?: {
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
  curriculum_id?: string | null;
  majorId?: string | null;
  major_id?: string | null;
  major?: { 
    majorId?: string; 
    major_id?: string; 
    majorCode?: string; 
    major_code?: string; 
    majorName?: string; 
    major_name?: string; 
  } | null;
  taskName: string;
  task_name?: string;
  description: string;
  status: TaskStatus;
  priority: string;
  type: string;
  action?: string;
  deadline?: string;
  dueDate?: string;
  document?: {
    documentId: string;
    documentUrl: string;
  };
  createdBy?: {
    accountId: string;
    email: string;
    fullName: string;
  };
  completedAt?: string | null;
  target_id?: string | null;
  targetId?: string | null;
  root_task_id?: string | null;
  rootTaskId?: string | null;
  createdAt: string;
  isAccepted?: boolean | null;
  comment?: string | null;
}

export interface TasksPaginatedResponse {
  content: TaskItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface TaskQueryParams {
  search?: string;
  status?: TaskStatus | string | string[];
  sprintId?: string;
  accountId?: string;
  assignTo?: string;
  createdBy?: string;
  action?: string;
  type?: string;
  targetId?: string;
  majorId?: string;
  departmentId?: string;
  syllabusId?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: "asc" | "desc";
}

export interface TaskQueryParamsV2 {
  search?: string;
  status?: TaskStatus | string | string[];
  sprintId?: string;
  type?: string;
  action?: string | string[];
  assignTo?: string;
  createdBy?: string;
  targetId?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: "asc" | "desc";
}

export interface CreateTaskPayload {
  sprintId: string;
  assignTo?: string;
  taskName: string;
  description: string;
  action?: string;
  priority: string | null;
  type: string;
  targetId?: string;
  rootTaskId?: string | null;
  dueDate?: string;
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

export const TaskService = {
  getTasks: async (params?: TaskQueryParams): Promise<TasksPaginatedResponse> => {
    // If multiple statuses are provided, we map them into parallel requests.
    if (Array.isArray(params?.status)) {
        const results = await Promise.all(params.status.map(async (s) => {
            const singleParams = { ...params, status: s };
            return await TaskService.getTasks(singleParams);
        }));

        const combinedContent = results.flatMap(r => r.content || []);
        const firstResult = results[0];

        if (!firstResult) {
            return { content: [], totalElements: 0, totalPages: 1, page: 0, size: params.size || 10 };
        }
        
        return {
            ...firstResult,
            content: combinedContent,
            totalElements: results.reduce((acc, r) => acc + (r.totalElements || 0), 0),
            totalPages: Math.max(1, ...results.map(r => r.totalPages || 1))
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
    
    // Support both accountId (legacy) and assignTo (v2)
    const assignTo = params?.assignTo || params?.accountId;
    if (assignTo) queryParams.append("assignTo", assignTo);
    
    if (params?.createdBy) queryParams.append("createdBy", params.createdBy);
    if (params?.action) queryParams.append("action", params.action);
    if (params?.type) queryParams.append("type", params.type);
    if (params?.targetId) queryParams.append("targetId", params.targetId);
    if (params?.majorId) queryParams.append("majorId", params.majorId);
    if (params?.departmentId)
      queryParams.append("departmentId", params.departmentId);
    if (params?.syllabusId) queryParams.append("syllabusId", params.syllabusId);

    const response = await apiClient.get<TasksPaginatedResponse>(
          `/api/v1/tasks-v2?${queryParams.toString()}`,
          { credentials: "include" },
      );

    return {
      ...response,
      content: response.content ? response.content.map(TaskService.mapTaskApiToItem) : [],
    };
  },

  getTasksV2: async (params?: TaskQueryParamsV2): Promise<TasksPaginatedResponse> => {
    // If multiple actions are provided, we map them into parallel requests.
    if (Array.isArray(params?.action)) {
        const results = await Promise.all(params.action.map(async (a) => {
            const singleParams = { ...params, action: a };
            return await TaskService.getTasksV2(singleParams);
        }));

        const combinedContent = results.flatMap(r => r?.content || []);
        const firstResult = results[0];

        if (!firstResult) return { content: [], totalElements: 0, totalPages: 1, page: 0, size: params.size || 10 };
        
        return {
            ...firstResult,
            content: combinedContent,
            totalElements: results.reduce((acc, r) => acc + (r?.totalElements || 0), 0),
            totalPages: Math.max(1, ...results.map(r => r?.totalPages || 1))
        };
    }

    // If multiple statuses are provided, we map them into parallel requests.
    if (Array.isArray(params?.status)) {
        const results = await Promise.all(params.status.map(async (s) => {
            const singleParams = { ...params, status: s };
            return await TaskService.getTasksV2(singleParams);
        }));

        const combinedContent = results.flatMap(r => r?.content || []);
        const firstResult = results[0];

        if (!firstResult) return { content: [], totalElements: 0, totalPages: 1, page: 0, size: params.size || 10 };
        
        return {
            ...firstResult,
            content: combinedContent,
            totalElements: results.reduce((acc, r) => acc + (r?.totalElements || 0), 0),
            totalPages: Math.max(1, ...results.map(r => r?.totalPages || 1))
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
    if (params?.type) queryParams.append("type", params.type);
    if (params?.action && !Array.isArray(params.action)) queryParams.append("action", params.action);
    if (params?.assignTo) queryParams.append("assignTo", params.assignTo);
    if (params?.createdBy) queryParams.append("createdBy", params.createdBy);
    if (params?.targetId) queryParams.append("targetId", params.targetId);

    const response = await apiClient.get<TasksPaginatedResponse>(
          `/api/v1/tasks-v2?${queryParams.toString()}`,
          { credentials: "include" },
      );

    return {
      ...response,
      content: response.content ? response.content.map(TaskService.mapTaskApiToItem) : [],
    };
  },

  mapTaskApiToItem: (task: any): TaskItem => ({
    taskId: task.taskId,
    sprintId: task.sprintId,
    subjectId: task.subjectId || task.subject?.subjectId || task.syllabus?.subjectId,
    subjectStatus: task.subjectStatus || task.subject?.status || (task as any).statusSubject,
    subject: task.subject,
    account: {
      accountId: task.assignTo?.accountId || task.account?.accountId || task.accountId || "",
      email: task.assignTo?.email || task.account?.email || task.email || "",
      fullName: task.assignTo?.fullName || task.account?.fullName || task.fullName || "Unassigned",
    },
    syllabus: {
      syllabusId: task.syllabus?.syllabusId || task.syllabusId || "",
      syllabusName: task.syllabus?.syllabusName || task.syllabusName || "Unnamed Syllabus",
    },
    curriculumId: task.curriculumId ?? task.curriculum_id ?? null,
    major: task.major ? {
        majorId: task.major.majorId ?? task.major.major_id,
        majorCode: task.major.majorCode ?? task.major.major_code,
        majorName: task.major.majorName ?? task.major.major_name,
    } : null,
    taskName: task.taskName ?? task.task_name,
    description: task.description,
    status: task.status,
    priority: task.priority,
    type: task.type,
    action: task.action,
    deadline: task.deadline || task.dueDate,
    document: task.document ? {
      documentId: task.document.documentId,
      documentUrl: task.document.documentUrl,
      majorId: task.document.majorId || task.document.major_id,
    } : undefined,
    majorId: task.majorId ?? task.major?.majorId ?? task.document?.majorId ?? task.document?.major_id ?? null,
    createdBy: task.createdBy ? {
      accountId: task.createdBy.accountId,
      email: task.createdBy.email,
      fullName: task.createdBy.fullName,
    } : undefined,
    completedAt: task.completedAt ?? null,
    targetId: task.targetId ?? task.target_id ?? null,
    rootTaskId: task.rootTaskId ?? task.root_task_id ?? null,
    createdAt: task.createdAt,
    syllabusStatus: task.syllabus?.status || null,
    isAccepted: task.isAccepted ?? null,
    comment: task.comment ?? null,
  }),

  getTaskById: async (taskId: string, options?: { signal?: AbortSignal }) => {
    const response = await apiClient.get<TaskApiItem>(
      `/api/v1/tasks-v2/${taskId}`,
      options,
    );
    return {
      status: 200,
      message: "Success",
      data: TaskService.mapTaskApiToItem(response)
    };
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
    }>("/api/v1/tasks-v2", payload, {
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
    type?: string,
  ): Promise<TasksPaginatedResponse> => {
    return await TaskService.getTasks({
      sprintId,
      departmentId,
      accountId,
      type,
      size: 100,
      sortBy: "deadline",
      direction: "asc",
    });
  },

  getTasksBySprintId: async (
    sprintId: string,
    accountId?: string,
    type?: string,
  ): Promise<TasksPaginatedResponse> => {
    return await TaskService.getTasks({
      sprintId,
      accountId,
      type,
      size: 100,
      sortBy: "deadline",
      direction: "asc",
    });
  },

  updateTaskStatus: async (taskId: string, status: TaskStatus) => {
    return apiClient.patch<{ status: number; message: string; data?: unknown }>(
      `/api/v1/tasks-v2/${taskId}/status?status=${status}`,
      {},
      { credentials: "include" }
    );
  },

  acceptTask: async (
    taskId: string,
    isAccepted: boolean | null,
    comment: string | null,
  ) => {
    const isAcceptedVal = isAccepted === null ? "null" : String(isAccepted);
    const commentVal = comment === null ? "" : encodeURIComponent(comment);
    return apiClient.patch<{ status: number; message: string; data?: unknown }>(
      `/api/v1/tasks-v2/${taskId}/isAccepted?isAccepted=${isAcceptedVal}&comment=${commentVal}`,
      {},
      { credentials: "include" },
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
