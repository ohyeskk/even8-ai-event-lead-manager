import { useState } from "react";
import "./AuthPage.css";

export default function AuthPage({ onAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function signIn(event) {
    event.preventDefault();
    setError("");
    if (email.trim().toLowerCase() === "jayesh@gmail.com" && password === "jayesh") {
      onAuthenticated();
      return;
    }
    setError("Email or password is incorrect.");
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
        <p className="auth-intro">Sign in to open the event lead manager.</p>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={signIn}>
          <label htmlFor="login-email">Email address</label>
          <input id="login-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="jayesh@gmail.com" />
          <label htmlFor="login-password">Password</label>
          <input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="jayesh" />
          <button className="auth-submit" type="submit">Sign in</button>
        </form>
        <p className="auth-footnote">Demo sign-in: jayesh@gmail.com / jayesh</p>
      </section>
      <span className="auth-copyright">GATHER <b>·</b> EVEN8</span>
    </main>
  );
}
