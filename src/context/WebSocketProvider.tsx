"use client";

/**
 * WebSocketProvider
 *
 * Wraps the app to manage WebSocket lifecycle:
 *  1. Connects after user is authenticated (auth state has user).
 *  2. Subscribes to the user's personal notification topic + system broadcast.
 *  3. Dispatches realtime messages into the Redux notification slice.
 *  4. Fetches initial snapshot (notification list + unread count) via REST.
 *  5. Disconnects on logout / unmount.
 */

import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { wsService } from '@/services/websocket.service';
import {
  handleRealtimeMessage,
  clearNotifications,
  fetchNotifications,
  fetchUnreadCount,
} from '@/store/slices/notificationSlice';
import { RealtimePayload } from '@/types/notification';

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const unsubscribersRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!user) {
      // If no user, ensure we're disconnected
      wsService.disconnect();
      dispatch(clearNotifications());
      return;
    }

    // ---- 1. Connect WebSocket ----
    wsService.connect();

    // ---- 2. Subscribe to notification topics ----
    const accountId = user.accountId || user.id;
    const departmentId = user.departmentId;

    // Personal notification topic (required)
    const unsubAccount = wsService.subscribe(
      `/topic/notification/account/${accountId}`,
      (payload: RealtimePayload) => {
        dispatch(handleRealtimeMessage(payload));
      },
    );
    unsubscribersRef.current.push(unsubAccount);

    // System broadcast (required)
    const unsubSystem = wsService.subscribe(
      '/topic/notification/broadcast/system',
      (payload: RealtimePayload) => {
        dispatch(handleRealtimeMessage(payload));
      },
    );
    unsubscribersRef.current.push(unsubSystem);

    // Department topic (if user has a department)
    if (departmentId) {
      const unsubDept = wsService.subscribe(
        `/topic/notification/department/${departmentId}`,
        (payload: RealtimePayload) => {
          dispatch(handleRealtimeMessage(payload));
        },
      );
      unsubscribersRef.current.push(unsubDept);

      // Department broadcast
      const unsubDeptBroadcast = wsService.subscribe(
        `/topic/notification/broadcast/department/${departmentId}`,
        (payload: RealtimePayload) => {
          dispatch(handleRealtimeMessage(payload));
        },
      );
      unsubscribersRef.current.push(unsubDeptBroadcast);
    }

    // ---- 3. Fetch initial REST snapshot ----
    dispatch(fetchNotifications({ page: 0, size: 10 }));
    dispatch(fetchUnreadCount());

    // ---- 4. Cleanup on unmount or user change ----
    return () => {
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
      wsService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.accountId || user?.id]);

  return <>{children}</>;
}
