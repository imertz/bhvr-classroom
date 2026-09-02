// client/src/pages/LoginPage.tsx
import { useState, useEffect } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading, error, isAuthenticated, clearError } =
    useAuthStore();
  const navigate = useNavigate();

  // All hooks must be called before any conditional returns
  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (email || password) {
      clearError();
    }
  }, [email, password, clearError]);

  // Now conditional returns can happen
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return;
    }

    try {
      await login({ email, password });
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const disabled = isLoading || !email || !password;

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[5fr_7fr]">
      {/* ================= PLATE — inked panel ================= */}
      <aside className="relative flex flex-col justify-between overflow-hidden bg-foreground px-8 py-10 text-background lg:px-12 lg:py-14">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-3/5 opacity-[0.14] lg:block"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, currentColor 0, currentColor 1px, transparent 1px, transparent 25%)",
          }}
          aria-hidden="true"
        />

        <div className="anim-rise relative flex items-center gap-3">
          <span className="block size-3 shrink-0 bg-signal" aria-hidden="true" />
          <span className="font-mono text-[0.6875rem] font-semibold uppercase leading-none tracking-[0.2em]">
            Classroom
          </span>
        </div>

        <div className="relative my-14 lg:my-0">
          <h1 className="display anim-wipe lag-1 max-w-[8ch] text-[clamp(2.75rem,7vw,4.75rem)]">
            Access the record.
          </h1>
          <p className="anim-rise lag-3 mt-7 max-w-sm text-[0.9375rem] leading-[1.7] text-background/55">
            Classes, enrolment, attendance and grades — held as one continuous
            record and released only to the account it belongs to.
          </p>
        </div>

        <dl className="anim-rise lag-4 relative grid grid-cols-2 gap-px border-t border-background/15 pt-6 text-background/55 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <dt className="micro text-background/40">Session</dt>
            <dd className="index-numeral text-[0.6875rem]">15 MIN · REFRESHED</dd>
          </div>
          <div className="flex flex-col gap-2">
            <dt className="micro text-background/40">Roles</dt>
            <dd className="index-numeral text-[0.6875rem]">ADMIN · STAFF · STDN</dd>
          </div>
          <div className="hidden flex-col gap-2 sm:flex">
            <dt className="micro text-background/40">Access</dt>
            <dd className="index-numeral text-[0.6875rem]">ROLE SCOPED</dd>
          </div>
        </dl>
      </aside>

      {/* ================= FORM ================= */}
      <main className="flex items-center justify-center bg-background px-6 py-14 sm:px-10 lg:px-16">
        <div className="w-full max-w-[26rem]">
          <div className="anim-rise flex items-center gap-5">
            <span className="micro micro-signal shrink-0">Sign in</span>
            <span className="anim-rule lag-1 h-px flex-1 bg-rule" />
          </div>

          <h2 className="display anim-rise lag-1 mt-7 text-[2rem]">
            Identify yourself.
          </h2>

          <form className="mt-12" onSubmit={handleSubmit} noValidate>
            <div className="stagger">
              {/* --- 01 EMAIL --- */}
              <div className="border-t border-rule py-5">
                <label
                  htmlFor="email"
                  className="flex items-baseline gap-4"
                >
                  <span className="index-numeral text-[0.6875rem] text-muted-foreground">
                    01
                  </span>
                  <span className="micro micro-ink">Email address</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field mt-3"
                  placeholder="name@school.edu"
                  disabled={isLoading}
                />
              </div>

              {/* --- 02 PASSWORD --- */}
              <div className="border-t border-rule py-5">
                <div className="flex items-baseline justify-between gap-4">
                  <label htmlFor="password" className="flex items-baseline gap-4">
                    <span className="index-numeral text-[0.6875rem] text-muted-foreground">
                      02
                    </span>
                    <span className="micro micro-ink">Password</span>
                  </label>
                  <button
                    type="button"
                    className="micro transition-colors duration-100 hover:text-signal disabled:opacity-40"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field mt-3"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="anim-rise mt-6 border-l-2 border-destructive bg-destructive/[0.06] px-4 py-3"
              >
                <span className="micro text-destructive">Authentication failed</span>
                <p className="mt-2 text-[0.8125rem] leading-snug text-foreground">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={disabled}
              className="relative mt-8 flex h-12 w-full items-center justify-center overflow-hidden bg-foreground font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-background transition-colors duration-100 hover:bg-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-foreground"
            >
              {isLoading ? "Authenticating…" : "Sign in"}
              {isLoading && (
                <span
                  className="anim-sweep absolute bottom-0 left-0 h-[2px] w-1/4 bg-signal"
                  aria-hidden="true"
                />
              )}
            </button>

            <div className="mt-8 flex items-baseline justify-between gap-4 border-t border-rule pt-5">
              <span className="micro">No account?</span>
              <Link
                to="/register"
                className="micro micro-signal underline decoration-1 underline-offset-4 transition-colors duration-100 hover:text-foreground"
              >
                Register as staff →
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
