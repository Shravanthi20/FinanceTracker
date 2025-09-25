function Home() {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  })();
  return (
    <>
      <div className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Master Your Money</h1>
          <p className="hero-subtitle">Import statements, categorize expenses, and visualize insights in seconds.</p>
          <div className="hero-actions">
            {!user ? (
              <>
                <a className="button" href="/register">Get Started</a>
                <a className="button" href="/login" style={{ marginLeft: 8 }}>Login</a>
              </>
            ) : (
              <>
                <a className="button" href="/upload">Import CSV/PDF</a>
                <a className="button" href="/logout" style={{ marginLeft: 8 }}>Logout</a>
              </>
            )}
          </div>
        </div>
      </div>

      <section className="section">
        <h2 className="section-title">Why FinTracker?</h2>
        <div className="grid">
          <div className="feature">
            <div className="feature-icon">💳</div>
            <h3 className="feature-title">Smart Imports</h3>
            <p className="feature-desc">Upload CSV/PDF from banks and wallets. We parse and structure it for you.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Clear Insights</h3>
            <p className="feature-desc">Track trends, categories, and monthly burn with simple visuals.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🔒</div>
            <h3 className="feature-title">Secure by Design</h3>
            <p className="feature-desc">Your data stays private with token-based auth and modern security.</p>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="about">
          <img className="about-img" src="/logo.jpg" alt="FinTracker" />
          <div className="about-text">
            <h2 className="section-title">About FinTracker</h2>
            <p>
              FinTracker helps individuals and teams stay on top of spending. Import your statements,
              set budgets, and collaborate with groups for shared expenses.
            </p>
            <p>
              We support personal and business flows with simple, clean interfaces.
            </p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container" style={{ padding: 0 }}>
          <span>© {new Date().getFullYear()} FinTracker</span>
        </div>
      </footer>
    </>
  );
}

export default Home;
