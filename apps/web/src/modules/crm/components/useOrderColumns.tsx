import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDate, formatPrice } from "../../../utils/format";
import type { Order, OrderStatus } from "../data/types";
import { StatusBadge, type BadgeTone } from "./StatusBadge";

const STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  pending: "neutral",
  processing: "warning",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
};

/** Shared order table columns — used by the Orders page and the dashboard. */
export function useOrderColumns(): ColumnDef<Order>[] {
  const { t, i18n } = useTranslation("crm");
  const locale = i18n.resolvedLanguage ?? "es";

  return useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: "id",
        header: t("orders.col.id"),
        cell: ({ row }) => (
          <span className="font-body text-label-bold">{row.original.id}</span>
        ),
      },
      { accessorKey: "customer", header: t("orders.col.customer") },
      {
        accessorKey: "date",
        header: t("orders.col.date"),
        cell: ({ row }) => formatDate(row.original.date, locale),
      },
      {
        accessorKey: "status",
        header: t("orders.col.status"),
        cell: ({ row }) => (
          <StatusBadge tone={STATUS_TONE[row.original.status]}>
            {t(`orderStatus.${row.original.status}`)}
          </StatusBadge>
        ),
      },
      {
        accessorKey: "items",
        header: t("orders.col.items"),
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.items}</span>
        ),
      },
      {
        accessorKey: "total",
        header: t("orders.col.total"),
        cell: ({ row }) => (
          <span className="font-body text-label-bold tabular-nums">
            {formatPrice(row.original.total, row.original.currency, locale)}
          </span>
        ),
      },
    ],
    [t, locale],
  );
}
