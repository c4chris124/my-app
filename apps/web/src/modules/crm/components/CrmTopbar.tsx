import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MdLogout } from "react-icons/md";
import { LanguageToggle } from "../../../components/LanguageToggle";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { useAuthStore } from "../../../services/authStore";

/**
 * CRM page header: contextual title, language/theme controls, signed-in user
 * and a logout action.
 */
export function CrmTopbar({ title }: { title: string }) {
  const { t } = useTranslation("crm");
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate("/crm/login", { replace: true });
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-stack-md border-b-2 border-on-surface bg-surface px-margin-mobile py-stack-md lg:px-stack-xl">
      <h1 className="font-display text-headline-lg uppercase text-on-surface">
        {title}
      </h1>

      <div className="flex items-center gap-stack-md">
        <LanguageToggle />
        <ThemeToggle />
        <div className="hidden items-end leading-tight sm:flex sm:flex-col">
          <span className="font-body text-label-bold text-on-surface">
            {user?.name}
          </span>
          <span className="font-body text-label-sm uppercase tracking-wide text-on-surface-variant">
            {user?.role}
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex h-12 items-center gap-stack-sm border-2 border-on-surface bg-surface-container px-stack-md font-heading text-headline-md uppercase tracking-wide text-on-surface transition-shadow hover:shadow-pressed"
        >
          <MdLogout aria-hidden size={20} className="text-accent" />
          <span className="hidden sm:inline">{t("actions.logout")}</span>
        </button>
      </div>
    </header>
  );
}
