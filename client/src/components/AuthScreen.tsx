import { useState } from "react";
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useI18n } from "../lib/i18n";

type AuthMode = "login" | "signup";

type AuthScreenProps = {
  onReady?: () => void;
};

function getAuthErrorKey(error: unknown) {
  if (!(error instanceof Error)) return "auth.errorDefault";

  if (error.message.includes("auth/invalid-credential")) return "auth.errorInvalid";
  if (error.message.includes("auth/email-already-in-use")) return "auth.errorExists";
  if (error.message.includes("auth/weak-password")) return "auth.errorWeak";
  if (error.message.includes("auth/popup-closed-by-user")) return "auth.errorCancelled";

  return "auth.errorDefault";
}

export function AuthScreen({ onReady }: AuthScreenProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onReady?.();
    } catch (authError) {
      setError(t(getAuthErrorKey(authError)));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setLoading(true);
    setError(null);

    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      onReady?.();
    } catch (authError) {
      setError(t(getAuthErrorKey(authError)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-hero card">
        <span className="eyebrow">{t("auth.cloud")}</span>
        <h1>{t("auth.welcome")}</h1>
        <div className="auth-perks">
          <span>{t("auth.contacts")}</span>
          <span>{t("auth.templates")}</span>
          <span>{t("auth.history")}</span>
        </div>
      </section>

      <section className="auth-card card">
        <div className="auth-tabs" role="tablist" aria-label="Connexion PeachMail">
          <button
            className={mode === "login" ? "active-tab" : "secondary-button"}
            type="button"
            onClick={() => setMode("login")}
          >
            {t("auth.login")}
          </button>
          <button
            className={mode === "signup" ? "active-tab" : "secondary-button"}
            type="button"
            onClick={() => setMode("signup")}
          >
            {t("auth.signup")}
          </button>
        </div>

        <form className="auth-form" onSubmit={handleEmailAuth}>
          <label>
            {t("auth.email")}
            <input
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="hello@peachmail.local"
              required
              type="email"
            />
          </label>

          <label>
            {t("auth.password")}
            <input
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("auth.passwordPlaceholder")}
              required
              type="password"
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <button className="primary-button" disabled={loading} type="submit">
            {mode === "signup" ? t("auth.create") : t("auth.signIn")}
          </button>
        </form>

        <div className="auth-divider">
          <span>{t("auth.or")}</span>
        </div>

        <button className="google-button" disabled={loading} type="button" onClick={handleGoogleAuth}>
          {t("auth.google")}
        </button>

        <p className="auth-note">
          {t("auth.note")}
        </p>
      </section>
    </main>
  );
}
