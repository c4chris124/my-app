import { useTranslation } from "react-i18next";
import {
  MdEuro,
  MdReceiptLong,
  MdGroup,
  MdPendingActions,
} from "react-icons/md";
import { useDashboardStats, useOrders } from "../services/queries";
import { StatCard } from "../components/StatCard";
import { DataTable } from "../components/DataTable";
import { useOrderColumns } from "../components/useOrderColumns";
import { Skeleton } from "../../../components/Skeleton";
import { ErrorState } from "../../../components/ErrorState";
import { formatPrice } from "../../../utils/format";

export default function Dashboard() {
  const { t, i18n } = useTranslation("crm");
  const locale = i18n.resolvedLanguage ?? "es";
  const stats = useDashboardStats();
  const orders = useOrders();
  const columns = useOrderColumns();

  return (
    <div className="space-y-stack-xl">
      <section aria-label={t("dashboard.metrics")}>
        {stats.isError ? (
          <ErrorState onRetry={stats.refetch} />
        ) : (
          <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4">
            {stats.isPending ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-36" />
              ))
            ) : (
              <>
                <StatCard
                  label={t("dashboard.revenue")}
                  value={formatPrice(
                    stats.data.revenue,
                    stats.data.currency,
                    locale,
                  )}
                  icon={MdEuro}
                  trend={stats.data.revenueTrend}
                />
                <StatCard
                  label={t("dashboard.orders")}
                  value={String(stats.data.orders)}
                  icon={MdReceiptLong}
                  trend={stats.data.ordersTrend}
                />
                <StatCard
                  label={t("dashboard.customers")}
                  value={String(stats.data.customers)}
                  icon={MdGroup}
                />
                <StatCard
                  label={t("dashboard.pending")}
                  value={String(stats.data.pendingOrders)}
                  icon={MdPendingActions}
                />
              </>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-stack-md font-heading text-headline-lg uppercase tracking-wide text-on-surface">
          {t("dashboard.recentOrders")}
        </h2>
        {orders.isError ? (
          <ErrorState onRetry={orders.refetch} />
        ) : orders.isPending ? (
          <Skeleton className="h-64" />
        ) : (
          <DataTable columns={columns} data={orders.data.slice(0, 5)} />
        )}
      </section>
    </div>
  );
}
