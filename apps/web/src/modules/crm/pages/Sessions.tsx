import { useTranslation } from "react-i18next";
import { MdDevices, MdLogout } from "react-icons/md";
import {
  useRevokeOtherSessions,
  useRevokeSession,
  useSessions,
} from "../services/queries";
import { Button } from "../../../components/Button";
import { Skeleton } from "../../../components/Skeleton";
import { ErrorState } from "../../../components/ErrorState";

/**
 * Device / session management. Lists the user's active sessions (resolved live
 * from Redis by the API), flags the current device, and lets the user revoke a
 * specific session or every other session.
 */
export default function Sessions() {
  const { t, i18n } = useTranslation("crm");
  const locale = i18n.resolvedLanguage ?? "es";
  const { data, isPending, isError, refetch } = useSessions();
  const revokeOne = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <div className="space-y-stack-xl">
      <header className="flex flex-wrap items-center justify-between gap-stack-md">
        <div className="flex items-center gap-stack-sm">
          <MdDevices className="text-headline-lg text-secondary" aria-hidden />
          <div>
            <h1 className="font-display text-display-sm text-on-surface">
              {t("sessions.title")}
            </h1>
            <p className="font-body text-body-md text-on-surface-variant">
              {t("sessions.subtitle")}
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          disabled={revokeOthers.isPending || !data || data.length <= 1}
          onClick={() => revokeOthers.mutate()}
        >
          {revokeOthers.isPending
            ? t("sessions.revokingOthers")
            : t("sessions.revokeOthers")}
        </Button>
      </header>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isPending ? (
        <div className="space-y-stack-md">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <ul className="space-y-stack-md">
          {data.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-stack-md border border-outline-variant bg-surface p-stack-lg"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-stack-sm">
                  <span className="font-body text-label-bold text-on-surface">
                    {s.deviceLabel}
                  </span>
                  {s.current && (
                    <span className="bg-secondary px-stack-sm py-stack-xs font-accent text-label-sm uppercase tracking-wide text-on-secondary">
                      {t("sessions.current")}
                    </span>
                  )}
                </div>
                <dl className="mt-stack-xs grid grid-cols-1 gap-x-stack-lg gap-y-stack-xs font-body text-label-sm text-on-surface-variant sm:grid-cols-2">
                  <div>
                    {t("sessions.ip")}: {s.ipLastSeen ?? s.ipCreated ?? "—"}
                  </div>
                  <div>
                    {t("sessions.lastSeen")}: {fmt(s.lastSeenAt)}
                  </div>
                  <div>
                    {t("sessions.signedIn")}: {fmt(s.createdAt)}
                  </div>
                  <div>
                    {t("sessions.expires")}: {fmt(s.absoluteExpiresAt)}
                  </div>
                </dl>
              </div>
              <Button
                variant="secondary"
                disabled={revokeOne.isPending}
                onClick={() => revokeOne.mutate(s.id)}
                className="flex items-center gap-stack-sm"
              >
                <MdLogout aria-hidden />
                {s.current
                  ? t("sessions.signOut")
                  : t("sessions.revoke")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
