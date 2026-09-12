import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  // RTK's default middleware is kept as-is; the serializability and
  // immutability checks are dev-only and are automatically stripped in
  // production builds, so they cost nothing at runtime for users.
  devTools: import.meta.env.MODE !== "production",
});

export default store;
