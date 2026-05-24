import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { NotificationData, RealtimePayload } from '@/types/notification';
import { NotificationService } from '@/services/notification.service';

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */

interface NotificationState {
  notifications: NotificationData[];
  unreadCount: number;
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  /** The latest notification that arrived via WebSocket (for toast popup). */
  latestRealtimeNotification: NotificationData | null;
  /** Realtime status message from AI Processing */
  aiProcessingMessage: string | null;
  /** Realtime status code from AI Processing */
  aiProcessingStatus: string | null;
  /** Realtime status data from AI Processing (can be validation report object) */
  aiProcessingData: any | null;
  /** Incremented whenever a task-related notification arrives to trigger UI refetch */
  refreshTaskTrigger: number;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  pageSize: 10,
  isLoading: false,
  error: null,
  latestRealtimeNotification: null,
  aiProcessingMessage: null,
  aiProcessingStatus: null,
  aiProcessingData: null,
  refreshTaskTrigger: 0,
};

/* ------------------------------------------------------------------ */
/*  Async Thunks                                                       */
/* ------------------------------------------------------------------ */

// Fetch paginated notifications
export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (
    { page = 0, size = 10, isRead }: { page?: number; size?: number; isRead?: boolean },
    { rejectWithValue },
  ) => {
    try {
      const res = await NotificationService.getMyNotifications(page, size, isRead);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch notifications');
    }
  },
);

// Fetch unread count
export const fetchUnreadCount = createAsyncThunk(
  'notification/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const res = await NotificationService.getUnreadCount();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch unread count');
    }
  },
);

// Mark single notification as read
export const markNotificationRead = createAsyncThunk(
  'notification/markRead',
  async (id: string, { rejectWithValue }) => {
    try {
      await NotificationService.markAsRead(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to mark as read');
    }
  },
);

// Mark all as read
export const markAllNotificationsRead = createAsyncThunk(
  'notification/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await NotificationService.markAllAsRead();
      return true;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to mark all as read');
    }
  },
);

/* ------------------------------------------------------------------ */
/*  Slice                                                              */
/* ------------------------------------------------------------------ */

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    /**
     * Handle an incoming realtime notification message.
     * This is called from the WebSocket provider when a new message arrives.
     */
    handleRealtimeMessage(state, action: PayloadAction<RealtimePayload>) {
      const { code, data, message } = action.payload;
      
      // DEBUG: Xem backend gửi chính xác cục JSON gì
      console.log("===> INCOMING WS MESSAGE:", action.payload);

      switch (code) {
        case 'STATUS_UPDATE': {
          // Lấy status thật sự từ chuỗi "Status updated: PROCESSING"
          if (message && message.startsWith("Status updated: ")) {
            state.aiProcessingStatus = message.replace("Status updated: ", "").trim();
          }
          
          // Store the realtime AI processing status safely
          if (data && typeof data === 'object') {
            state.aiProcessingData = data;
            state.aiProcessingMessage = message || "Processing...";
          } else {
            state.aiProcessingData = null;
            state.aiProcessingMessage = data || message || "Processing...";
          }
          console.log(`[STATUS_UPDATE] Status: ${state.aiProcessingStatus} | Msg: ${state.aiProcessingMessage}`);
          break;
        }
        case 'NOTIFICATION':
        case 'BROADCAST_DEPARTMENT':
        case 'BROADCAST_SYSTEM': {
          // New notification arrived — prepend to list and bump unread
          if (data) {
            const exists = state.notifications.some(
              (n) => n.notificationId === data.notificationId,
            );
            if (!exists) {
              state.notifications.unshift(data);
              state.totalElements += 1;
              if (!data.isRead) {
                state.unreadCount += 1;
              }
              // Set as latest for toast popup
              state.latestRealtimeNotification = data;

              // If it's a task notification, trigger a refresh for task lists
              if (data.type === 'TASK') {
                state.refreshTaskTrigger += 1;
              }
            }
          }
          break;
        }

        case 'NOTIFICATION_READ': {
          // A notification was marked as read (could be from another tab/device)
          if (data) {
            const idx = state.notifications.findIndex(
              (n) => n.notificationId === data.notificationId,
            );
            if (idx !== -1 && !state.notifications[idx].isRead) {
              state.notifications[idx].isRead = true;
              state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
          }
          break;
        }

        case 'ALL_NOTIFICATIONS_READ': {
          // All notifications marked read
          state.notifications.forEach((n) => {
            n.isRead = true;
          });
          state.unreadCount = 0;
          break;
        }

        default:
          break;
      }
    },

    /** Dismiss the toast popup for the latest realtime notification. */
    dismissLatestNotification(state) {
      state.latestRealtimeNotification = null;
    },

    /** Clear all state (e.g. on logout). */
    clearNotifications(state) {
      Object.assign(state, initialState);
    },

    /** Clear the AI processing message */
    clearAiProcessingMessage(state) {
      state.aiProcessingMessage = null;
      state.aiProcessingStatus = null;
      state.aiProcessingData = null;
    },
  },

  extraReducers: (builder) => {
    builder
      /* fetchNotifications */
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.content;
        state.totalElements = action.payload.totalElements;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.number;
        state.pageSize = action.payload.size;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      /* fetchUnreadCount */
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })

      /* markNotificationRead */
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const id = action.payload;
        const idx = state.notifications.findIndex((n) => n.notificationId === id);
        if (idx !== -1 && !state.notifications[idx].isRead) {
          state.notifications[idx].isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })

      /* markAllNotificationsRead */
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.isRead = true;
        });
        state.unreadCount = 0;
      });
  },
});

export const { handleRealtimeMessage, dismissLatestNotification, clearNotifications, clearAiProcessingMessage } = notificationSlice.actions;
export default notificationSlice.reducer;
