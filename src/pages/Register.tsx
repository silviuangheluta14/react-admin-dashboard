import { type FormEvent, useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../utils/firebase";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");   
  const [loading, setLoading] = useState(false); 

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(""); 
    setSuccess(""); 
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "user",
        displayName: "",
        createdAt: serverTimestamp(),
      });

      login({ id: user.uid, email: user.email ?? "", role: "user" });

      setSuccess("✅ Account created successfully! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1200); 
    } catch (err: any) {
      setError(err.message || "Registration error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth">
      <h2 className="auth__title">Create Account</h2>

      <form className="auth__form" onSubmit={onSubmit}>
        <input
          className="input"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <input
          className="input"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>

        <p style={{ fontSize: 13, marginTop: 10 }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>

      {success && <p style={{ color: "green", fontSize: 12, marginTop: 8 }}>{success}</p>}
      {error && <p style={{ color: "red", fontSize: 12, marginTop: 8 }}>{error}</p>}
    </section>
  );
}
