import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import howellLogo from "../assets/howell-logo.png";
import { login } from "../services/mockAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
  const [email, setEmail] = useState("austin@howelltechnologies.com");
  const [password, setPassword] = useState("howell-admin");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <form onSubmit={handleSubmit} className="login-panel">
        <div className="login-brand">
          <div className="login-logo">
            <img src={howellLogo} alt="Howell Technologies logo" />
          </div>
          <div>
            <p className="eyebrow">Howell Technologies</p>
            <h1>Admin Portal</h1>
          </div>
        </div>

        <div className="login-divider" />

        <p className="login-subtitle">Sign in to view client portals, application health, and operational status.</p>

        <div className="login-form">
          <label className="login-field">
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
          </label>
          <label className="login-field">
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" disabled={submitting} className="login-submit">
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </div>

        <p className="login-note">Mock access: `austin@howelltechnologies.com` / `howell-admin`</p>
      </form>
    </main>
  );
}
