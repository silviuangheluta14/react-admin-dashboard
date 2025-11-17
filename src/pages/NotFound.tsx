export default function NotFound() {
  return (
    <section className="error">
      <div className="error__card">
        <h1>Oooopppssss</h1>
        <h2>Page not found</h2>
        <p>Nothing here.</p>
        <a className="btn btn--primary" href="/dashboard">Go to Dashboard</a>
      </div>
    </section>
  );
}
