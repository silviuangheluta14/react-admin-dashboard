import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../utils/firebase";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  active: boolean;
  createdAt?: any;
  updatedAt?: any;
};

type SortBy = "createdAt" | "price" | "stock";
type SortDir = "asc" | "desc";

const CATEGORIES = ["Automotive", "Electronics", "Home", "Accessories"];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [onlyActive, setOnlyActive] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [editing, setEditing] = useState<Product | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("");
  const [stock, setStock] = useState<string>("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "products"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Product[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name ?? "",
            price: data.price ?? 0,
            stock: data.stock ?? 0,
            category: data.category ?? "Other",
            active: data.active ?? true,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        });
        setProducts(list);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Could not load product list.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const resetForm = () => {
    setName("");
    setPrice("");
    setStock("");
    setCategory(CATEGORIES[0]);
    setActive(true);
    setEditing(null);
    setError(null);
  };

  const handleEditClick = (product: Product) => {
    setEditing(product);
    setName(product.name);
    setPrice(String(product.price));
    setStock(String(product.stock));
    setCategory(product.category);
    setActive(product.active);
  };

  const handleDelete = async (id: string) => {
    const sure = window.confirm("Are you sure you want to delete this product?");
    if (!sure) return;

    try {
      await deleteDoc(doc(db, "products", id));
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const priceNumber = Number(price);
    const stockNumber = Number(stock);

    if (!name.trim()) {
  setError("Name is required.");
  return;
}
if (Number.isNaN(priceNumber) || priceNumber < 0) {
  setError("Price must be a number ≥ 0.");
  return;
}
if (!Number.isInteger(stockNumber) || stockNumber < 0) {
  setError("Stock must be an integer ≥ 0.");
  return;
}


    setSaving(true);
    try {
      if (editing) {
        await updateDoc(doc(db, "products", editing.id), {
          name: name.trim(),
          price: priceNumber,
          stock: stockNumber,
          category,
          active,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "products"), {
          name: name.trim(),
          price: priceNumber,
          stock: stockNumber,
          category,
          active,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      resetForm();
    } catch (err) {
      console.error(err);
      setError("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(s)
      );
    }

    if (filterCategory !== "all") {
      list = list.filter((p) => p.category === filterCategory);
    }

    if (onlyActive) {
      list = list.filter((p) => p.active);
    }

    list.sort((a, b) => {
      let valueA: number;
      let valueB: number;

      switch (sortBy) {
        case "price":
          valueA = a.price;
          valueB = b.price;
          break;
        case "stock":
          valueA = a.stock;
          valueB = b.stock;
          break;
        default:
          valueA = a.createdAt?.toMillis
            ? a.createdAt.toMillis()
            : 0;
          valueB = b.createdAt?.toMillis
            ? b.createdAt.toMillis()
            : 0;
      }

      const diff = valueA - valueB;
      return sortDir === "asc" ? diff : -diff;
    });

    return list;
  }, [products, search, filterCategory, onlyActive, sortBy, sortDir]);

  return (
  <section className="page">
    <div className="page__header">
      <h2 className="page__title">Products</h2>
      <p className="page__subtitle">
        Manage products using Firestore (CRUD, filters, sorting, active status).
      </p>
    </div>

    <div className="grid grid--2">
      {/* Form */}
      <div className="card">
        <h3 className="card__title">
          {editing ? "Edit product" : "Add product"}
        </h3>

          {error && <div className="alert alert--error">{error}</div>}

          <form onSubmit={handleSubmit} className="form form--vertical">
            <div className="form__group">
              <label className="form__label">Name</label>
              <input
                type="text"
                className="form__input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: turbocharger"
              />
            </div>

            <div className="form__group">
              <label className="form__label">Category</label>
              <select
                className="form__select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form__group form__group--inline">
              <div>
                <label className="form__label">Price</label>
                <input
                  type="number"
                  className="form__input"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min={0}
                  step={0.01}
                />
              </div>
              <div>
                <label className="form__label">Stock</label>
                <input
                  type="number"
                  className="form__input"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  min={0}
                  step={1}
                />
              </div>
            </div>

            <div className="form__group form__group--inline">
              <label className="form__checkbox">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                <span>Active product</span>
              </label>
            </div>

            <div className="form__actions">
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editing
                  ? "Save changes"
                  : "Add product"}
              </button>
              {editing && (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Listă produse */}
        <div className="card">
          <div className="card__header card__header--filters">
            <h3 className="card__title">Products list</h3>

            <div className="card__filters">
              <input
                type="text"
                className="form__input form__input--sm"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                className="form__select form__select--sm"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                className="form__select form__select--sm"
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split("-") as [
                    SortBy,
                    SortDir
                  ];
                  setSortBy(field);
                  setSortDir(dir);
                }}
              >
                <option value="createdAt-desc">Newest</option>
                <option value="createdAt-asc">Oldest</option>
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
                <option value="stock-asc">Stock ↑</option>
                <option value="stock-desc">Stock ↓</option>
              </select>

              <label className="form__checkbox form__checkbox--sm">
                <input
                  type="checkbox"
                  checked={onlyActive}
                  onChange={(e) => setOnlyActive(e.target.checked)}
                />
                <span>Only active</span>
              </label>
            </div>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : filteredProducts.length === 0 ? (
            <div>No products found.</div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Stock</th>
                    <th>Status</th>
                    <th style={{ width: 140 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.category}</td>
                      <td className="text-right">
                        {p.price.toLocaleString("en-GB", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </td>
                      <td className="text-right">{p.stock}</td>
                      <td>
                        {p.active ? (
                          <span className="badge badge--success">Active</span>
                        ) : (
                          <span className="badge badge--muted">Hidden</span>
                        )}
                      </td>
                      <td>
                        <div className="table__actions">
                          <button
                            className="btn btn--xs btn--ghost"
                            onClick={() => handleEditClick(p)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn--xs btn--danger"
                            onClick={() => handleDelete(p.id)}
                          >
                            Delete
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
      </div>
    </section>
  );
}
