import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../utils/firebase";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      login({ id: user.uid, email: user.email ?? "", role: "user" });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <section className="auth">
      <h2 className="auth__title">Sign In</h2>
      <form className="auth__form" onSubmit={onSubmit}>
        <input
          className="input"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn btn--primary" type="submit">Sign in</button>

        <p style={{ fontSize: 13, marginTop: 10 }}>
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </form>

      {error && <p style={{ color: "red", fontSize: 12 }}>{error}</p>}
    </section>
  );
}
