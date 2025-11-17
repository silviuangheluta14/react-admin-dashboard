export default function NotAuthorized() {
  return (
    <section className="error error--403">
      <div className="error__card">
        <h1>Oooopppssss</h1>
        <h2></h2>
        <p>You do not have permission to access this page.</p>
        <a className="btn btn--primary" href="/dashboard">Back to Dashboard</a>
      </div>
    </section>
  );
}
