// src/utils/db.ts
import {
  collection, query, orderBy, limit, onSnapshot,
  getCountFromServer, Timestamp, addDoc
} from "firebase/firestore";
import { db } from "./firebase";

// Simple collection refs
export const colOrders   = () => collection(db, "orders");
export const colProducts = () => collection(db, "products");
export const colUsers    = () => collection(db, "users");

// Fast server-side count
export async function getCollectionCount(path: "orders" | "products" | "users") {
  const snap = await getCountFromServer(collection(db, path));
  return snap.data().count;
}

// Live: latest 10 orders
export function listenRecentOrders(cb: (rows: any[]) => void) {
  const q = query(colOrders(), orderBy("createdAt", "desc"), limit(10));
  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    cb(rows);
  });
}

// Utility: seed demo documents (for visual testing only)
export async function seedDemoData() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  // 6 products
  for (let i = 1; i <= 6; i++) {
    await addDoc(colProducts(), {
      name: `Product ${i}`,
      price: 19.99 + i,
      stock: 20 + i * 3,
      createdAt: Timestamp.fromMillis(now - i * day),
    });
  }

  // 18 orders in the last 7 days with random totals
  for (let i = 0; i < 18; i++) {
    const d = now - Math.floor(Math.random() * 7) * day - Math.floor(Math.random() * 12) * 3600 * 1000;
    await addDoc(colOrders(), {
      total: Math.round((20 + Math.random() * 180) * 100) / 100,
      status: ["pending", "paid", "cancelled"][Math.floor(Math.random() * 3)],
      createdAt: Timestamp.fromMillis(d),
    });
  }
}
