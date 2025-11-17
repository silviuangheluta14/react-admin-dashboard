import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getCountFromServer,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../utils/firebase";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type Order = {
  id: string;
  createdAt?: any;
  status?: string;
  total?: number;
  amount?: number;
  [key: string]: any;
};

type DailyRevenue = {
  dateLabel: string;
  dateKey: string; // YYYY-MM-DD
  revenue: number;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#facc15",
  paid: "#22c55e",
  completed: "#22c55e",
  cancelled: "#ef4444",
  refunded: "#0ea5e9",
  unknown: "#a3a3a3",
};

export default function Dashboard() {
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [productsCount, setProductsCount] = useState<number | null>(null);
  const [ordersCount, setOrdersCount] = useState<number | null>(null);

  const [orders30d, setOrders30d] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    async function loadCounts() {
      try {
        const [usersSnap, productsSnap, ordersSnap] = await Promise.all([
          getCountFromServer(collection(db, "users")),
          getCountFromServer(collection(db, "products")),
          getCountFromServer(collection(db, "orders")),
        ]);

        setUsersCount(usersSnap.data().count);
        setProductsCount(productsSnap.data().count);
        setOrdersCount(ordersSnap.data().count);
      } catch (err) {
        console.error("Error loading counts", err);
      }
    }

    loadCounts();
  }, []);

  //subscribe orders last 30 days
  useEffect(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const q = query(
      collection(db, "orders"),
      where("createdAt", ">=", Timestamp.fromDate(thirtyDaysAgo)),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Order[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setOrders30d(list);
        setLoadingOrders(false);
      },
      (err) => {
        console.error("Error loading orders", err);
        setLoadingOrders(false);
      }
    );

    return () => unsub();
  }, []);

  // utils
  const getOrderTotal = (o: Order) =>
    typeof o.total === "number"
      ? o.total
      : typeof o.amount === "number"
      ? o.amount
      : 0;

  //derive data for last 7 days revenue
  const {
    dailyRevenue7d,
    totalRevenue7d,
    avgOrderValue7d,
    todayOrdersCount,
  } = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6); //7 days 

    const orders7d = orders30d.filter((o) => {
      const ts = o.createdAt;
      if (!ts?.toDate) return false;
      const d = ts.toDate() as Date;
      return d >= sevenDaysAgo;
    });

    // initialize map
    const dayMap: Record<string, DailyRevenue> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const label = d.toLocaleDateString("ro-RO", {
        day: "2-digit",
        month: "2-digit",
      });
      dayMap[key] = {
        dateKey: key,
        dateLabel: label,
        revenue: 0,
      };
    }

    let totalRevenue = 0;
    let totalOrders = 0;
    let todayCount = 0;

    const todayKey = now.toISOString().slice(0, 10);

    for (const o of orders7d) {
      const ts = o.createdAt;
      if (!ts?.toDate) continue;
      const d = ts.toDate() as Date;
      const key = d.toISOString().slice(0, 10);
      const amount = getOrderTotal(o);
      if (dayMap[key]) {
        dayMap[key].revenue += amount;
      }
      totalRevenue += amount;
      totalOrders += 1;

      if (key === todayKey) {
        todayCount += 1;
      }
    }

    const dailyRevenue7d = Object.values(dayMap);

    const avgOrderValue =
      totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      dailyRevenue7d,
      totalRevenue7d: totalRevenue,
      avgOrderValue7d: avgOrderValue,
      todayOrdersCount: todayCount,
    };
  }, [orders30d]);

  // 4️⃣ orders by status (last 30 days)
  const ordersByStatus = useMemo(() => {
    const map: Record<string, number> = {};

    for (const o of orders30d) {
      const raw = (o.status || "unknown") as string;
      const key = raw.toLowerCase();
      map[key] = (map[key] || 0) + 1;
    }

    return Object.entries(map).map(([status, value]) => ({
      status,
      value,
    }));
  }, [orders30d]);

  //recent orders table (last 5, desc)
  const recentOrders = useMemo(() => {
    const sorted = [...orders30d].sort((a, b) => {
      const ta = a.createdAt?.toMillis
        ? a.createdAt.toMillis()
        : 0;
      const tb = b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : 0;
      return tb - ta;
    });
    return sorted.slice(0, 5);
  }, [orders30d]);

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-GB", {
      style: "currency",
      currency: "EUR",
    });

  const formatDateTime = (ts: any) => {
    if (!ts?.toDate) return "-";
    const d = ts.toDate() as Date;
    return d.toLocaleString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
  <section className="page dashboard">
    <div className="page__header">
      <h2 className="page__title">Dashboard</h2>
      <p className="page__subtitle">
        Business overview — users, products, orders, and performance
        over the last 7–30 days.
      </p>
    </div>

      {/* STAT CARDS */}
      <div className="dashboard__grid dashboard__grid--stats">
        <div className="card stat-card">
          <div className="stat-card__label">Total users</div>
          <div className="stat-card__value">
            {usersCount ?? "—"}
          </div>
          <div className="stat-card__hint">
            Registered accounts in the application.
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-card__label">Total products</div>
          <div className="stat-card__value">
            {productsCount ?? "—"}
          </div>
          <div className="stat-card__hint">
            Active products in the catalog.
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-card__label">Total orders</div>
          <div className="stat-card__value">
            {ordersCount ?? "—"}
          </div>
          <div className="stat-card__hint">
            All orders in the system.
          </div>
        </div>

        <div className="card stat-card stat-card--accent">
          <div className="stat-card__label">
            Revenue (last 7 days)
          </div>
          <div className="stat-card__value">
            {formatCurrency(totalRevenue7d)}
          </div>
          <div className="stat-card__meta">
            <span>
              Avg. order:{" "}
              <strong>
                {formatCurrency(avgOrderValue7d || 0)}
              </strong>
            </span>
            <span>•</span>
            <span>
              Orders today:{" "}
              <strong>{todayOrdersCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="dashboard__grid dashboard__grid--charts">
        {/* Revenue chart */}
        <div className="card card--chart">
          <div className="card__header">
            <h3 className="card__title">
              Revenue last 7 days
            </h3>
            <p className="card__subtitle">
              Total daily revenue from recorded orders.
            </p>
          </div>
          {loadingOrders ? (
            <div>Loading...</div>
          ) : (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={dailyRevenue7d}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dateLabel" />
                  <YAxis
                    tickFormatter={(v) =>
                      v >= 1000 ? `${v / 1000}k` : v
                    }
                  />
                  <Tooltip
                    formatter={(value: any) =>
                      formatCurrency(Number(value))
                    }
                    labelFormatter={(label) =>
                      `Date: ${label}`
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Orders by status */}
        <div className="card card--chart">
          <div className="card__header">
            <h3 className="card__title">
              Orders by status (30 days)
            </h3>
            <p className="card__subtitle">
              Order status distribution over the last month.
            </p>
          </div>
          {loadingOrders ? (
            <div>Loading...</div>
          ) : ordersByStatus.length === 0 ? (
            <div>No orders in the last 30 days.</div>
          ) : (
            <div className="chart-wrapper chart-wrapper--center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    dataKey="value"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ index, value }) =>
                    `${ordersByStatus[index].status} (${value})`
                   }
                  >
                    {ordersByStatus.map((entry, index) => {
                      const color =
                        STATUS_COLORS[entry.status] ||
                        Object.values(STATUS_COLORS)[
                          index %
                            Object.values(STATUS_COLORS).length
                        ];
                      return (
                        <Cell key={entry.status} fill={color} />
                      );
                    })}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* RECENT ORDERS */}
      <div className="card card--table">
        <div className="card__header">
          <h3 className="card__title">Recent orders</h3>
          <p className="card__subtitle">
            Latest 5 orders created (last 30 days).
          </p>
        </div>

        {loadingOrders ? (
          <div>Loading...</div>
        ) : recentOrders.length === 0 ? (
          <div>No recent orders.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                  <th>Created at</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => {
                  const status =
                    (o.status as string | undefined)?.toLowerCase() ??
                    "unknown";
                  const color =
                    STATUS_COLORS[status] ?? "#a3a3a3";

                  return (
                    <tr key={o.id}>
                      <td className="table__cell--mono">
                        {o.id.slice(0, 8)}…
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: `${color}22`,
                            color,
                          }}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="text-right">
                        {formatCurrency(getOrderTotal(o))}
                      </td>
                      <td>{formatDateTime(o.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
