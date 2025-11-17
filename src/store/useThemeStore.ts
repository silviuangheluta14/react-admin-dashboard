import { create } from "zustand";


type Theme = "light" | "dark";


interface ThemeState {
theme: Theme;
toggleTheme: () => void;
setTheme: (t: Theme) => void;
}


function getInitialTheme(): Theme {
const saved = localStorage.getItem("theme");
if (saved === "light" || saved === "dark") return saved;
const mql = window.matchMedia("(prefers-color-scheme: dark)");
return mql.matches ? "dark" : "light";
}


export const useTheme = create<ThemeState>((set) => ({
theme: getInitialTheme(),
toggleTheme: () =>
set((s) => {
const next = s.theme === "dark" ? "light" : "dark";
document.documentElement.classList.toggle("dark", next === "dark");
localStorage.setItem("theme", next);
return { theme: next };
}),
setTheme: (t) => {
document.documentElement.classList.toggle("dark", t === "dark");
localStorage.setItem("theme", t);
set({ theme: t });
},
}));


// apply theme on load
if (typeof document !== "undefined") {
const initial = (localStorage.getItem("theme") as "light" | "dark") ??
(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
document.documentElement.classList.toggle("dark", initial === "dark");
}