import { NavLink } from "react-router-dom";
import { clsx } from "clsx";
import { LayoutDashboard, Package, ShoppingCart, Users as UsersIcon } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

type LinkItem = { to: string; label: string; icon: any; role?: "admin" | "user" };

const allLinks: LinkItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/orders",    label: "Orders",    icon: ShoppingCart },
  { to: "/products",  label: "Products",  icon: Package,     role: "admin" },
  { to: "/users",     label: "Users",     icon: UsersIcon,   role: "admin" },
];

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "user";
  const links = allLinks.filter((l) => !l.role || l.role === role);

  return (
    <aside className="sidebar">
      {user && (
        <div className="sidebar__user">
          <span className="sidebar__user-name">{user.email}</span>
        </div>
      )}

      <nav className="sidebar__nav">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx("sidebar__link", isActive && "sidebar__link--active")
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
