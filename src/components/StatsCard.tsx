// src/components/StatsCard.tsx
type Props = {
  title: string;
  value: string | number;
  hint?: string;
};

export default function StatsCard({ title, value, hint }: Props) {
  return (
    <div className="card" style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      {hint && <div style={{ fontSize: 12, opacity: 0.6 }}>{hint}</div>}
    </div>
  );
}
