import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authServices from "../../services/authService";
import { readJsonCookie, clearCookie, USER_INFO_COOKIE } from "../../utils/cookies";

/**
 * Auth state is hydrated synchronously from the readable `user_info` cookie
 * so the first paint already knows whether someone is signed in — no
 * "logged out" flash while a /profile request is in flight. The actual
 * credential is the httpOnly `token` cookie, which JS never touches.
 */
const cachedUser = readJsonCookie(USER_INFO_COOKIE);

const initialState = {
  user: cachedUser,
  isAuthenticated: Boolean(cachedUser),
  // `loading` covers in-flight login/register/logout calls (drives button
  // spinners). `initializing` covers the one-time background revalidation
  // of the cached cookie against the server on app boot.
  loading: false,
  initializing: Boolean(cachedUser),
  error: null,
};

const extractMessage = (err, fallback) =>
  err?.message || err?.response?.data?.message || fallback;

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await authServices.login(email, password);
      return data.user;
    } catch (err) {
      return rejectWithValue(extractMessage(err, "Login failed"));
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authServices.register(payload);
      return data.user;
    } catch (err) {
      return rejectWithValue(extractMessage(err, "Registration failed"));
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await authServices.logout();
  } catch {
    // Even if the server call fails (offline, 500), we still clear local
    // state below — a user clicking "log out" must never stay logged in
    // from their point of view.
  }
  clearCookie(USER_INFO_COOKIE);
  return true;
});

/**
 * Revalidates the cached cookie against the server on app boot. If the
 * token expired while the tab was closed, this is what catches it.
 */
export const fetchProfile = createAsyncThunk(
  "auth/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const data = await authServices.getProfile();
      return data.user;
    } catch (err) {
      return rejectWithValue(extractMessage(err, "Session expired"));
    }
  }
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (userData, { rejectWithValue }) => {
    try {
      const data = await authServices.updateProfile(userData);
      return data.user;
    } catch (err) {
      return rejectWithValue(extractMessage(err, "Failed to update profile"));
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const onAuthSuccess = (state, action) => {
      state.loading = false;
      state.initializing = false;
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    };

    const onPending = (state) => {
      state.loading = true;
      state.error = null;
    };

    const onAuthFailure = (state, action) => {
      state.loading = false;
      state.error = action.payload;
    };

    builder
      .addCase(login.pending, onPending)
      .addCase(login.fulfilled, onAuthSuccess)
      .addCase(login.rejected, onAuthFailure)

      .addCase(register.pending, onPending)
      .addCase(register.fulfilled, onAuthSuccess)
      .addCase(register.rejected, onAuthFailure)

      .addCase(updateProfile.pending, onPending)
      .addCase(updateProfile.fulfilled, onAuthSuccess)
      .addCase(updateProfile.rejected, onAuthFailure)

      // Background revalidation — deliberately does NOT set `loading`, so it
      // never blocks the UI or triggers button spinners.
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.initializing = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchProfile.rejected, (state) => {
        state.initializing = false;
        state.user = null;
        state.isAuthenticated = false;
      })

      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.initializing = false;
        state.error = null;
      });
  },
});

export const { clearError } = authSlice.actions;

// Selectors kept beside the slice so components import from one place and
// state shape stays an implementation detail.
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthInitializing = (state) => state.auth.initializing;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
