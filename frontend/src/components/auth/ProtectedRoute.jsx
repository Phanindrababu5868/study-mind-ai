import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import AppLayout from "../layout/AppLayout";
import Spinner from "../common/Spinner";
import {
  selectIsAuthenticated,
  selectAuthInitializing,
} from "../../store/slices/authSlice";

const ProtectedRoute = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const initializing = useSelector(selectAuthInitializing);

  // Guard against bouncing a valid user to /login while the cached session
  // is still being revalidated against the server.
  if (initializing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return isAuthenticated ? (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ) : (
    <Navigate to="/login" replace />
  );
};

export default ProtectedRoute;
