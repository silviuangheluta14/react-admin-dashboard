# React Admin Dashboard (Firebase + Vite + TypeScript)

A modern admin dashboard built with **React + TypeScript + Vite**, featuring **authentication, user roles, Firestore CRUD, real-time data updates, charts and theme switching**.

Designed as a real-world portfolio project suitable for full-stack / frontend interviews.

## 🚀 Live Demo
_(optional – will add link after deploy)_

## 📸 Preview
_(add screenshots later)_

---

## 🔥 Features

### 🔐 Authentication
- Firebase Auth (email/password)
- Login / Register
- Protected routes
- Role-based access (admin vs user)
- Auto-persist session

### 👥 User Management
- Firestore users collection
- Change roles (user/admin)
- Enable / disable users
- Delete user records
- Filters + search + live updates

### 📦 Product Management
- Create / edit / delete products
- Stock, price, categories
- Validation
- Firestore live sync

### 📊 Dashboard
- Statistics cards (users / products / orders / revenue)
- Live charts (Recharts)
- Order status distribution
- Latest orders table

### ⚡ Tech Stack
| Category | Tech |
|----------|------|
| UI | React 18 + TypeScript + Vite |
| State | Zustand |
| Backend | Firebase Auth + Firestore |
| Charts | Recharts |
| Styling | Custom CSS + CSS variables + dark mode |
| Routing | React Router |
| Dev Tools | ESLint, Prettier, GitHub |

---

## 🛠️ Project Structure

src/
├─ components/
├─ pages/
├─ utils/
├─ store/
├─ styles/
└─ App.tsx

## 🧪 Demo Data
The project includes seeding utilities for development:

```ts
import { seedProducts, seedUsers } from './utils/seed';

// seedProducts(20);
// seedUsers(10);
