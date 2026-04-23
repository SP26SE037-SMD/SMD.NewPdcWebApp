import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { AuthService } from "@/services/auth.service";
import { User } from "@/lib/auth";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: false, // Changed from true to false to prevent hydration mismatch
  error: null,
};

// Async Thunks
export const loginAction = createAsyncThunk(
  // Tác dụng của createAsyncThunk:
  // Nó sẽ tự động tạo ra 3 hành động (actions) để theo dõi quá trình request: pending, fulfilled, rejected.
  "auth/login",

  // Đây là cái hàm chính sẽ chạy khi có ai đó gọi tên dispatch(loginAction(...)).
  // 2 tham số:
  // email, password: Thông tin đăng nhập
  // { rejectWithValue }: Tự động tạo ra hành động rejected với giá trị lỗi
  async ({ email, password }: any, { rejectWithValue }) => {
    try {
      const { user } = await AuthService.login(email, password);

      // Immediately refresh profile from /api/auth/me after login so the app
      // gets the latest user payload without waiting for a full page refresh.
      const profile = await AuthService.getProfile();
      return profile || user;
    } catch (error: any) {
      return rejectWithValue(error.message || "Login failed");
    }
  },
);

export const logoutAction = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await AuthService.logout();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Logout failed");
    }
  },
);

export const getProfileAction = createAsyncThunk(
  "auth/getProfile",
  async (_, { rejectWithValue }) => {
    try {
      const userData = await AuthService.getProfile();
      return userData;
    } catch (error: any) {
      return rejectWithValue(null);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginAction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAction.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isLoading = false;
      })
      .addCase(loginAction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutAction.fulfilled, (state) => {
        state.user = null;
        state.isLoading = false;
      })
      // Get Profile (Session Recovery)
      .addCase(getProfileAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProfileAction.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isLoading = false;
      })
      .addCase(getProfileAction.rejected, (state) => {
        state.user = null;
        state.isLoading = false;
      });
  },
});

export const { setUser, setLoading, clearError } = authSlice.actions;
export default authSlice.reducer;
