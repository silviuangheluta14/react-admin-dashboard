import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export default function ProtectedRoute() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    // if no authenticated user → redirect to login
    return <Navigate to="/login" replace state={{ returnTo: location.pathname }} />;
  }

  // otherwise, render protected content
  return <Outlet />;
}
