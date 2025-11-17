// src/utils/seed.ts
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// Example only – use through dev tools / a separate button, not in production
export async function seedProducts(n: number = 20) {
  const categories = ["Automotive", "Electronics", "Home", "Accessories"];

  for (let i = 0; i < n; i++) {
    const category = categories[i % categories.length];

    await addDoc(collection(db, "products"), {
      name: `Sample product ${i + 1}`,
      price: 10 + i * 2,
      stock: 5 + (i % 10),
      category,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  console.log(`Seeded ${n} products`);
}

export async function seedUsers(n: number = 10) {
  for (let i = 0; i < n; i++) {
    const isAdmin = i === 0; // first user is demo admin

    await addDoc(collection(db, "users"), {
      email: isAdmin
        ? "admin@example.com"
        : `user${i}@example.com`,
      role: isAdmin ? "admin" : "user",
      disabled: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  console.log(`Seeded ${n} users`);
}
