import { Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "../../store/useThemeStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  return (
    <header className="navbar">
      <div className="navbar__left">
        <h1 className="navbar__title">React</h1>
      </div>

      <div className="navbar__right">
        <button className="btn" onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user && (
          <button className="btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span className="btn__label">Logout</span>
          </button>
        )}

        <div className="avatar">
          {user?.email ? user.email.charAt(0).toUpperCase() : "?"}
        </div>
      </div>
    </header>
  );
}
