import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import Products from "./pages/Products/Products";
import Users from "./pages/Users/Users";
import Orders from "./pages/Orders/Orders";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleGuard from "./routes/RoleGuard";
import NotAuthorized from "./pages/NotAuthorized";
import NotFound from "./pages/NotFound";
import { useAuthStore } from "./store/useAuthStore";

export default function App() {
  const initialized = useAuthStore((s) => s.initialized);

  if (!initialized) {
    return <div style={{ padding: "2rem" }}>Loading authentication...</div>;
  }
  return (
    <Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />

  <Route path="/403" element={<NotAuthorized />} />
  <Route path="*" element={<NotFound />} /> 
  
  <Route element={<Layout />}>
    <Route index element={<Navigate to="/dashboard" replace />} />

    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/orders" element={<Orders />} />
      <Route element={<RoleGuard allow={["admin"]} />}>
        <Route path="/products" element={<Products />} />
        <Route path="/users" element={<Users />} />
      </Route>
      
    </Route>
  </Route>
</Routes>
  );
}
