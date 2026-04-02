import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import howellLogo from "../assets/howell-logo.png";
import { HowellLogoSpinner } from "../components/HowellLogoSpinner";
import { login } from "../services/mockAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setEmail("");
    setPassword("");
    setError("");

    if (emailInputRef.current) {
      emailInputRef.current.value = "";
    }
    if (passwordInputRef.current) {
      passwordInputRef.current.value = "";
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (caughtError) {
      if (
        caughtError instanceof Error &&
        (caughtError.message === "Invalid mock credentials." ||
          caughtError.message === "Login failed: Incorrect username/password combo.")
      ) {
        setError("Login failed: Incorrect username/password combo.");
      } else {
        setError("Unable to log in.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={submitting ? "login-page login-page--busy" : "login-page"}>
      <form onSubmit={handleSubmit} className="login-panel" aria-hidden={submitting} autoComplete="off">
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

        <p className="login-subtitle">A focused workspace for client status, portal health, and demo-ready views.</p>

        <div className="login-form">
          <label className="login-field">
            Username
            <input
              ref={emailInputRef}
              name="ht_operator_username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              data-1p-ignore="true"
              data-lpignore="true"
              required
            />
          </label>
          <label className="login-field">
            Password
            <input
              ref={passwordInputRef}
              name="ht_operator_password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              data-1p-ignore="true"
              data-lpignore="true"
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" disabled={submitting} className="login-submit">
            {submitting ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>
      {submitting ? (
        <div className="login-loading-overlay" role="status" aria-live="polite" aria-label="Logging in">
          <HowellLogoSpinner size="lg" label="Logging in..." />
        </div>
      ) : null}
    </main>
  );
}
