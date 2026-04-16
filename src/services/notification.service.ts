/**
 * Notification REST API Service
 * Base path: /api/notifications (proxied through Next.js BFF)
 */

import { apiClient } from '@/lib/api-client';
import {
  NotificationPageResponse,
  UnreadCountResponse,
  NotificationData,
} from '@/types/notification';

const BASE = '/api/notifications';

export const NotificationService = {
  /**
   * Get current user's notifications (paginated)
   */
  async getMyNotifications(
    page = 0,
    size = 10,
    isRead?: boolean,
  ): Promise<NotificationPageResponse> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (isRead !== undefined) params.set('isRead', String(isRead));
    return apiClient.get<NotificationPageResponse>(
      `${BASE}/my-notifications?${params.toString()}`,
    );
  },

  /**
   * Get a single notification detail
   */
  async getNotificationById(id: string): Promise<{ data: NotificationData }> {
    return apiClient.get(`${BASE}/${id}`);
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<void> {
    return apiClient.put(`${BASE}/${id}/mark-as-read`, {});
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    return apiClient.post(`${BASE}/mark-all-as-read`, {});
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    return apiClient.get<UnreadCountResponse>(`${BASE}/unread-count`);
  },

  /**
   * Search notifications
   */
  async search(
    keyword: string,
    page = 0,
    size = 10,
  ): Promise<NotificationPageResponse> {
    const params = new URLSearchParams({
      search: keyword,
      page: String(page),
      size: String(size),
    });
    return apiClient.get<NotificationPageResponse>(
      `${BASE}/search?${params.toString()}`,
    );
  },
};
