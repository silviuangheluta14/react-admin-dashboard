import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../utils/firebase";

type Role = "admin" | "user";

type UserDoc = {
  id: string;
  email: string;
  role: Role;
  disabled: boolean;
  createdAt?: any;
  updatedAt?: any;
};

export default function Users() {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | Role>("all");
  const [showDisabled, setShowDisabled] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: UserDoc[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            email: data.email ?? "",
            role: (data.role as Role) ?? "user",
            disabled: data.disabled ?? false,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        });
        setUsers(list);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handleRoleChange = async (user: UserDoc, role: Role) => {
    if (user.role === role) return;
    setSavingId(user.id);
    try {
      await updateDoc(doc(db, "users", user.id), {
        role,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
      alert("An error occurred while updating the role.");
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleDisabled = async (user: UserDoc) => {
    setSavingId(user.id);
    try {
      await updateDoc(doc(db, "users", user.id), {
        disabled: !user.disabled,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
      alert("An error occurred while updating.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteDoc = async (user: UserDoc) => {
    const sure = window.confirm(
      `Are you sure you want to delete the document for ${user.email}?\n(Warning: this does NOT delete the account from Firebase Auth.)`
    );
    if (!sure) return;

    try {
      await deleteDoc(doc(db, "users", user.id));
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting the document.");
    }
  };

  const formatDate = (ts: any) => {
    if (!ts?.toDate) return "-";
    const d = ts.toDate() as Date;
    return d.toLocaleString("ro-RO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredUsers = useMemo(() => {
    let list = [...users];

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((u) => u.email.toLowerCase().includes(s));
    }

    if (filterRole !== "all") {
      list = list.filter((u) => u.role === filterRole);
    }

    if (!showDisabled) {
      list = list.filter((u) => !u.disabled);
    }

    return list;
  }, [users, search, filterRole, showDisabled]);

  return (
    <section className="page">
      <div className="page__header">
        <h2 className="page__title">Users</h2>
        <p className="page__subtitle">
          Manage users (role + status) from the <code>users</code> collection.
        </p>
      </div>

      <div className="card">
        <div className="card__header card__header--filters">
          <h3 className="card__title">Users list</h3>

          <div className="card__filters">
            <input
              type="text"
              className="form__input form__input--sm"
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="form__select form__select--sm"
              value={filterRole}
              onChange={(e) =>
                setFilterRole(e.target.value as "all" | Role)
              }
            >
              <option value="all">All roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>

            <label className="form__checkbox form__checkbox--sm">
              <input
                type="checkbox"
                checked={showDisabled}
                onChange={(e) => setShowDisabled(e.target.checked)}
              />
              <span>Show disabled</span>
            </label>
          </div>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : filteredUsers.length === 0 ? (
          <div>No users found.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created at</th>
                  <th style={{ width: 220 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>
                      <select
                        className="form__select form__select--sm"
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(u, e.target.value as Role)
                        }
                        disabled={savingId === u.id}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>
                      {u.disabled ? (
                        <span className="badge badge--danger">Disabled</span>
                      ) : (
                        <span className="badge badge--success">Active</span>
                      )}
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      <div className="table__actions">
                        <button
                          className="btn btn--xs btn--ghost"
                          onClick={() => handleToggleDisabled(u)}
                          disabled={savingId === u.id}
                        >
                          {u.disabled ? "Enable" : "Disable"}
                        </button>
                        <button
                          className="btn btn--xs btn--danger"
                          onClick={() => handleDeleteDoc(u)}
                        >
                          Delete doc
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
