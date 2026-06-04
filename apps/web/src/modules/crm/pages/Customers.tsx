import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { useCustomers } from "../services/queries";
import { DataTable } from "../components/DataTable";
import { StatusBadge, type BadgeTone } from "../components/StatusBadge";
import { Skeleton } from "../../../components/Skeleton";
import { ErrorState } from "../../../components/ErrorState";
import { formatPrice } from "../../../utils/format";
import type { Customer, CustomerStatus } from "../data/types";

const STATUS_TONE: Record<CustomerStatus, BadgeTone> = {
  active: "success",
  lead: "info",
  inactive: "neutral",
};

export default function Customers() {
  const { t, i18n } = useTranslation("crm");
  const locale = i18n.resolvedLanguage ?? "es";
  const { data, isPending, isError, refetch } = useCustomers();

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("customers.col.name"),
        cell: ({ row }) => (
          <span className="font-body text-label-bold">{row.original.name}</span>
        ),
      },
      { accessorKey: "company", header: t("customers.col.company") },
      {
        accessorKey: "email",
        header: t("customers.col.email"),
        cell: ({ row }) => (
          <span className="text-on-surface-variant">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "orders",
        header: t("customers.col.orders"),
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.orders}</span>
        ),
      },
      {
        accessorKey: "lifetimeValue",
        header: t("customers.col.ltv"),
        cell: ({ row }) => (
          <span className="font-body text-label-bold tabular-nums">
            {formatPrice(
              row.original.lifetimeValue,
              row.original.currency,
              locale,
            )}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: t("customers.col.status"),
        cell: ({ row }) => (
          <StatusBadge tone={STATUS_TONE[row.original.status]}>
            {t(`customerStatus.${row.original.status}`)}
          </StatusBadge>
        ),
      },
    ],
    [t, locale],
  );

  if (isError) return <ErrorState onRetry={refetch} />;
  if (isPending) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-stack-md">
      <p className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant">
        {t("customers.count", { count: data.length })}
      </p>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
