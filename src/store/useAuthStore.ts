import { create } from "zustand";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../utils/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../utils/firebase";

export type Role = "admin" | "user";

interface AuthState {
  user: null | { id: string; email: string; role: Role };
  login: (payload: { id: string; email: string; role?: Role }) => void;
  logout: () => void;
  initialized: boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  login: ({ id, email, role = "user" }) => set({ user: { id, email, role } }),
  logout: async () => {
    await signOut(auth);
    set({ user: null });
  },
}));

onAuthStateChanged(auth, async (user) => {
  const { login } = useAuthStore.getState();

  if (user) {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    let role: "admin" | "user" = "user";

    if (snap.exists()) {
      role = snap.data().role;
    }

    login({ id: user.uid, email: user.email ?? "", role });
  } else {
    useAuthStore.setState({ user: null });
  }

  useAuthStore.setState({ initialized: true });
});
