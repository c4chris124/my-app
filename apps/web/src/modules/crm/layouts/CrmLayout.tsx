import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CrmSidebar } from "../components/CrmSidebar";
import { CrmTopbar } from "../components/CrmTopbar";

/**
 * Dashboard shell for the CRM: persistent nav rail + a header that reflects the
 * active section, with routed content below. Wraps the authenticated routes.
 */
export default function CrmLayout() {
  const { t } = useTranslation("crm");
  const { pathname } = useLocation();
  // /crm/<section> → nav.<section> title key (falls back to dashboard).
  const section = pathname.split("/")[2] || "dashboard";

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background lg:flex-row">
      <CrmSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <CrmTopbar title={t(`nav.${section}`)} />
        <main className="flex-1 px-margin-mobile py-stack-lg lg:px-stack-xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
