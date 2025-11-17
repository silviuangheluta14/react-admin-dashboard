import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore,type Role } from "../store/useAuthStore";

export default function RoleGuard({ allow }: { allow: Role[] }) {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
