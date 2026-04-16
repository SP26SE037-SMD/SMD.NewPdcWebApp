/**
 * Notification Types — matching the WebSocket realtime payload contract.
 */

// Realtime payload from WebSocket (Section 5 of API contract)
export interface RealtimePayload {
  code: string;
  message: string;
  timestamp: string;
  data: NotificationData | null;
  meta: Record<string, unknown> | null;
}

// Notification data from REST API
export interface NotificationData {
  notificationId: string;
  title: string;
  content: string;      // may be empty — backend sends 'message' instead
  message?: string;      // actual content field from backend
  type: string; // e.g. 'TASK_ASSIGNED', 'REVIEW', 'SYLLABUS', 'SYSTEM', etc.
  isRead: boolean;
  createdAt: string;
  accountId?: string;
  accountEmail?: string;
  // Direct entity IDs from backend
  taskId?: string | null;
  reviewId?: string | null;
  // Legacy/alternate field names (kept for compatibility)
  relatedEntityId?: string;
  relatedEntityType?: string;
}

// REST API paginated response
export interface NotificationPageResponse {
  status: number;
  message: string;
  data: {
    content: NotificationData[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number; // current page (0-indexed)
  };
}

// Unread count response
export interface UnreadCountResponse {
  status: number;
  message: string;
  data: number;
}

// Message codes the frontend handles (Section 5.2)
export type NotificationCode =
  | 'NOTIFICATION'
  | 'NOTIFICATION_READ'
  | 'ALL_NOTIFICATIONS_READ'
  | 'BROADCAST_DEPARTMENT'
  | 'BROADCAST_SYSTEM';
