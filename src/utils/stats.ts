
import {
  collection,
  getCountFromServer,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

type Counts = {
  users: number;
  products: number;
  orders: number;
  revenue7d: number; // total sum over the last 7 days
};

type RevenuePoint = { name: string; value: number }; // for Recharts

// returns aggregated data for dashboard cards + chart
export async function getDashboardStats(): Promise<{
  counts: Counts;
  revenueSeries: RevenuePoint[];
}> {
  // 1) cards: fast counts (without downloading all documents)
  const [usersSnap, productsSnap, ordersSnap] = await Promise.all([
    getCountFromServer(collection(db, "users")),
    getCountFromServer(collection(db, "products")),
    getCountFromServer(collection(db, "orders")),
  ]);

  // 2) Chart + revenue7d: read orders from the last 7 days and sum totals
  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - 6); // include today + 6 days back

  const q7d = query(
    collection(db, "orders"),
    where("createdAt", ">=", Timestamp.fromDate(new Date(start.setHours(0, 0, 0, 0))))
  );
  const orders7dSnap = await getDocs(q7d);

  // Map totals per day (Sun, Mon, etc.)
  const buckets = new Map<string, number>();
  // initialize 7 keys so the chart has no gaps
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(now.getDate() - (6 - i));
    const label = dayLabels[d.getDay()];
    buckets.set(label, 0);
  }

  let revenue7d = 0;

  orders7dSnap.forEach((doc) => {
    const data = doc.data() as any;
    const ts: Timestamp | undefined = data.createdAt;
    const total: number = typeof data.total === "number" ? data.total : 0;

    if (ts) {
      const d = ts.toDate();
      const label = dayLabels[d.getDay()];
      buckets.set(label, (buckets.get(label) ?? 0) + total);
      revenue7d += total;
    }
  });

  const revenueSeries: RevenuePoint[] = Array.from(buckets.entries()).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  const counts: Counts = {
    users: usersSnap.data().count,
    products: productsSnap.data().count,
    orders: ordersSnap.data().count,
    revenue7d,
  };

  return { counts, revenueSeries };
}
