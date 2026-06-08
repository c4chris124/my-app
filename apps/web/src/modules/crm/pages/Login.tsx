import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FcGoogle } from "react-icons/fc";
import { Button } from "../../../components/Button";
import { LanguageToggle } from "../../../components/LanguageToggle";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { CRM_ROLES, useAuthStore } from "../../../services/authStore";

/** API origin for top-level OAuth navigation (same `/api` proxy as axios). */
const apiBase = import.meta.env.VITE_API_URL ?? "/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

interface LocationState {
  from?: { pathname: string };
}

export default function Login() {
  const { t } = useTranslation("crm");
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const login = useAuthStore((s) => s.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const redirectTo =
    (location.state as LocationState | null)?.from?.pathname ?? "/crm/dashboard";

  // Already signed in with a CRM role → skip the form.
  if (user && CRM_ROLES.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values, "crm");
      navigate(redirectTo, { replace: true });
    } catch {
      // Error surfaced via the auth store below.
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <header className="flex items-center justify-between border-b-2 border-on-surface bg-surface-container px-margin-mobile py-stack-md md:px-margin-desktop">
        <span className="font-display text-headline-lg text-on-surface">
          REHOBOT <span className="text-secondary">CRM</span>
        </span>
        <div className="flex items-center gap-stack-md">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-margin-mobile py-stack-xl">
        <div className="w-full max-w-md rounded-lg border border-outline-variant bg-surface p-stack-xl shadow-panel">
          <h1 className="font-display text-display-lg text-on-surface">
            {t("login.title")}
          </h1>
          <p className="mt-stack-sm font-body text-body-md text-on-surface-variant">
            {t("login.subtitle")}
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-stack-lg space-y-stack-md"
            noValidate
          >
            <div>
              <label
                htmlFor="email"
                className="block font-body text-label-bold uppercase tracking-wide text-on-surface"
              >
                {t("login.email")}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                {...register("email")}
                className="mt-stack-xs h-12 w-full rounded border border-outline bg-surface-container px-stack-md font-body text-body-md text-on-surface outline-none focus:border-secondary"
              />
              {errors.email && (
                <p className="mt-stack-xs font-body text-label-sm text-error">
                  {t("login.errorEmail")}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-body text-label-bold uppercase tracking-wide text-on-surface"
              >
                {t("login.password")}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
                className="mt-stack-xs h-12 w-full rounded border border-outline bg-surface-container px-stack-md font-body text-body-md text-on-surface outline-none focus:border-secondary"
              />
              {errors.password && (
                <p className="mt-stack-xs font-body text-label-sm text-error">
                  {t("login.errorPassword")}
                </p>
              )}
            </div>

            {status === "error" && (
              <p className="rounded border border-error bg-error-container/20 px-stack-md py-stack-sm font-body text-label-bold text-error">
                {t("login.failed")}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={status === "loading"}
              className="w-full disabled:opacity-60"
            >
              {status === "loading" ? t("login.submitting") : t("login.submit")}
            </Button>
          </form>

          <div className="mt-stack-lg flex items-center gap-stack-sm">
            <span className="h-px flex-1 bg-outline-variant" />
            <span className="font-body text-label-sm uppercase tracking-wide text-on-surface-variant">
              {t("login.or")}
            </span>
            <span className="h-px flex-1 bg-outline-variant" />
          </div>

          {/* Top-level navigation (not XHR) so the OAuth redirect works; the
              API resolves `state` as the post-login returnTo. */}
          <a
            href={`${apiBase}/auth/google?state=${encodeURIComponent(redirectTo)}`}
            className="mt-stack-md flex h-12 w-full items-center justify-center gap-stack-sm rounded border-2 border-outline bg-surface font-body text-body-md font-bold tracking-wide text-on-surface transition-colors hover:bg-surface-container"
          >
            <FcGoogle className="text-headline-md" aria-hidden />
            {t("login.google")}
          </a>

          <p className="mt-stack-lg border-t border-outline-variant pt-stack-md font-body text-label-sm text-on-surface-variant">
            {t("login.demoHint")}
          </p>
        </div>
      </main>
    </div>
  );
}
