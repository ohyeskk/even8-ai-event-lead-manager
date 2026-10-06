import { useState } from "react";
import "./AuthPage.css";

export default function AuthPage({ onAuthenticated }) {
  const [email, setEmail] = useState("jayesh@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signIn(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not sign in.");
      onAuthenticated();
    } catch (requestError) {
      setError(requestError.message || "Could not sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-brand" aria-label="Gather">
        <span className="auth-brand-mark"><i /><i /><i /><i /></span>
        <span>gather<span className="auth-brand-dot">.</span></span>
      </div>
      <section className="auth-card" aria-labelledby="auth-title">
        <span className="auth-eyebrow">EVEN8 LEAD MANAGER</span>
        <h1 id="auth-title">Welcome back.</h1>
        <p className="auth-intro">Sign in to open your private leads and AI tools.</p>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={signIn}>
          <label htmlFor="login-email">Email address</label>
          <input id="login-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="jayesh@gmail.com" />
          <label htmlFor="login-password">Password</label>
          <input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
          <button className="auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"}</button>
        </form>
        <a className="auth-home-link" href="/">Back to home</a>
      </section>
      <span className="auth-copyright">GATHER <b>·</b> EVEN8</span>
    </main>
  );
}
