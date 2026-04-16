"use client";

import { Provider } from 'react-redux';
import { store } from './index';
import { useEffect } from 'react';
import { getProfileAction } from './slices/authSlice';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Initialize session on mount. If the session check fails (401), redirect to login.
  useEffect(() => {
    store.dispatch(getProfileAction()).unwrap().catch(() => {
      // Session expired or not logged in — redirect to login with toast flag
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?reason=session_expired';
      }
    });
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
