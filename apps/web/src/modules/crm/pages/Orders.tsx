import { useTranslation } from "react-i18next";
import { useOrders } from "../services/queries";
import { DataTable } from "../components/DataTable";
import { useOrderColumns } from "../components/useOrderColumns";
import { Skeleton } from "../../../components/Skeleton";
import { ErrorState } from "../../../components/ErrorState";

export default function Orders() {
  const { t } = useTranslation("crm");
  const { data, isPending, isError, refetch } = useOrders();
  const columns = useOrderColumns();

  if (isError) return <ErrorState onRetry={refetch} />;
  if (isPending) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-stack-md">
      <p className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant">
        {t("orders.count", { count: data.length })}
      </p>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
