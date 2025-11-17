import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ChangeEvent,
} from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../utils/firebase";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useAuthStore } from "../../store/useAuthStore";

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

export interface Order {
  id: string;
  number: string;
  customer: string;
  status: OrderStatus;
  total: number; // EUR
  createdAt: Timestamp;
}

interface OrderForm {
  id?: string;
  number: string;
  customer: string;
  status: OrderStatus;
  total: number | "";
}

const fMoney = (n: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
  }).format(n);

const fDate = (t: Timestamp) => t.toDate().toLocaleDateString();

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const role = useAuthStore((s) => s.user?.role ?? "user");
  const isAdmin = role === "admin";

  // for Add / Edit
  const [editingOrder, setEditingOrder] = useState<OrderForm | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list: Order[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setOrders(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // KPIs
  const { count, revenue, completedCount, pendingCount } = useMemo(() => {
    const count = orders.length;
    const revenue = orders.reduce((s, o) => s + (o.total ?? 0), 0);
    const completedCount = orders.filter(
      (o) => o.status === "completed"
    ).length;
    const pendingCount = orders.filter((o) => o.status === "pending").length;
    return { count, revenue, completedCount, pendingCount };
  }, [orders]);

  // chart data – last 14 days
  const chartData = useMemo(() => {
    const byDay = new Map<string, number>();
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toLocaleDateString();
      byDay.set(key, 0);
    }
    orders.forEach((o) => {
      const key = o.createdAt?.toDate().toLocaleDateString();
      if (key && byDay.has(key))
        byDay.set(key, (byDay.get(key) ?? 0) + 1);
    });
    return Array.from(byDay.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [orders]);

  // SEED demo (localhost & admin)
  async function seedOrders() {
    const demo: Omit<Order, "id">[] = [
      {
        number: "#1001",
        customer: "Dexter Morgan",
        status: "completed",
        total: 129.9,
        createdAt: Timestamp.fromDate(
          new Date(Date.now() - 1000 * 60 * 60 * 24 * 1)
        ),
      },
      {
        number: "#1002",
        customer: "Arthur Mitchel",
        status: "processing",
        total: 89.5,
        createdAt: Timestamp.fromDate(
          new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
        ),
      },
      {
        number: "#1003",
        customer: "Joey Quinn",
        status: "pending",
        total: 59.0,
        createdAt: Timestamp.fromDate(
          new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
        ),
      },
      {
        number: "#1004",
        customer: "Angel Batista",
        status: "completed",
        total: 249.0,
        createdAt: Timestamp.fromDate(new Date()),
      },
      {
        number: "#1005",
        customer: "Rita Bennett",
        status: "cancelled",
        total: 49.0,
        createdAt: Timestamp.fromDate(new Date()),
      },
    ];

    for (const o of demo) {
      await addDoc(collection(db, "orders"), {
        ...o,
        createdAt: serverTimestamp(),
      });
    }
  }

  // CRUD
  function openCreate() {
    setEditingOrder({
      number: "",
      customer: "",
      status: "pending",
      total: "",
    });
  }

  function openEdit(order: Order) {
    setEditingOrder({
      id: order.id,
      number: order.number,
      customer: order.customer,
      status: order.status,
      total: order.total,
    });
  }

  function onChangeField(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    if (!editingOrder) return;
    const { name, value } = e.target;

    if (name === "total") {
      setEditingOrder({
        ...editingOrder,
        total: value === "" ? "" : Number(value),
      });
    } else {
      setEditingOrder({
        ...editingOrder,
        [name]: value,
      });
    }
  }

  async function onSubmitForm(e: FormEvent) {
    e.preventDefault();
    if (!editingOrder) return;

    setSaving(true);
    try {
      const payload = {
        number: editingOrder.number,
        customer: editingOrder.customer,
        status: editingOrder.status,
        total:
          editingOrder.total === "" ? 0 : Number(editingOrder.total),
        createdAt: serverTimestamp(),
      };

      if (editingOrder.id) {
        const { createdAt, ...rest } = payload; 
        await updateDoc(
          doc(db, "orders", editingOrder.id),
          rest as any
        );
      } else {
        await addDoc(collection(db, "orders"), payload as any);
      }

      setEditingOrder(null);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(order: Order) {
    const ok = window.confirm(
      `Are you sure you want to delete order ${order.number}?`
    );
    if (!ok) return;
    await deleteDoc(doc(db, "orders", order.id));
  }

  return (
    <section className="page">
      <h2 className="page__title">Orders</h2>

      {/* KPI cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div className="card">
          <div>Total Orders</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{count}</div>
        </div>
        <div className="card">
          <div>Completed</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {completedCount}
          </div>
        </div>
        <div className="card">
          <div>Pending</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {pendingCount}
          </div>
        </div>
        <div className="card">
          <div>Revenue</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {fMoney(revenue)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <h3>Orders — last 14 days</h3>
        <div className="chart">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table + actions */}
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0 }}>Orders list</h3>
          <div style={{ display: "flex", gap: 8 }}>
            {location.hostname.includes("localhost") && isAdmin && (
              <button className="btn" onClick={seedOrders}>
                Seed demo
              </button>
            )}
            {isAdmin && (
              <button className="btn btn--primary" onClick={openCreate}>
                + Add order
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div>Loading…</div>
        ) : orders.length === 0 ? (
          <div>No orders yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th
                    style={{
                      padding: 8,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    #
                  </th>
                  <th
                    style={{
                      padding: 8,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    Customer
                  </th>
                  <th
                    style={{
                      padding: 8,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: 8,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    Total
                  </th>
                  <th
                    style={{
                      padding: 8,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    Created
                  </th>
                  {isAdmin && (
                    <th
                      style={{
                        padding: 8,
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td
                      style={{
                        padding: 8,
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {o.number}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {o.customer}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          background:
                            o.status === "completed"
                              ? "#16a34a33"
                              : o.status === "pending"
                              ? "#f59e0b33"
                              : o.status === "cancelled"
                              ? "#ef444433"
                              : "#3b82f633",
                          border: "1px solid var(--border)",
                          textTransform: "capitalize",
                        }}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: 8,
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {fMoney(o.total)}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {o.createdAt ? fDate(o.createdAt) : "—"}
                    </td>
                    {isAdmin && (
                      <td
                        style={{
                          padding: 8,
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <button
                          className="btn"
                          style={{ marginRight: 6 }}
                          onClick={() => openEdit(o)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn"
                          onClick={() => onDelete(o)}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {editingOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 420,
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              {editingOrder.id ? "Edit order" : "Add order"}
            </h3>
            <form
              className="auth__form"
              onSubmit={onSubmitForm}
              style={{ gap: 10 }}
            >
              <input
                className="input"
                name="number"
                placeholder="Order number"
                value={editingOrder.number}
                onChange={onChangeField}
              />
              <input
                className="input"
                name="customer"
                placeholder="Customer name"
                value={editingOrder.customer}
                onChange={onChangeField}
              />
              <select
                className="input"
                name="status"
                value={editingOrder.status}
                onChange={onChangeField}
              >
                <option value="pending">pending</option>
                <option value="processing">processing</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
              <input
                className="input"
                name="total"
                type="number"
                placeholder="Total"
                value={editingOrder.total}
                onChange={onChangeField}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 6,
                }}
              >
                <button
                  type="button"
                  className="btn"
                  onClick={() => setEditingOrder(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="btn btn--primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
