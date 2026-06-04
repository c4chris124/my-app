import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { useCatalogs } from "../services/queries";
import { DataTable } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Skeleton } from "../../../components/Skeleton";
import { ErrorState } from "../../../components/ErrorState";
import type {
  CatalogCategory,
  CatalogSubcategory,
  PriceRule,
  Promotion,
} from "../data/types";

type TabKey = "categories" | "subcategories" | "prices" | "promotions";

const TABS: { key: TabKey; labelKey: string }[] = [
  { key: "categories", labelKey: "catalogs.tabs.categories" },
  { key: "subcategories", labelKey: "catalogs.tabs.subcategories" },
  { key: "prices", labelKey: "catalogs.tabs.prices" },
  { key: "promotions", labelKey: "catalogs.tabs.promotions" },
];

export default function Catalogs() {
  const { t } = useTranslation("crm");
  const [tab, setTab] = useState<TabKey>("categories");
  const { data, isPending, isError, refetch } = useCatalogs();

  const categoryColumns = useMemo<ColumnDef<CatalogCategory>[]>(
    () => [
      { accessorKey: "name", header: t("catalogs.col.name") },
      {
        accessorKey: "subcategories",
        header: t("catalogs.col.subcategories"),
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.subcategories}</span>
        ),
      },
      {
        accessorKey: "products",
        header: t("catalogs.col.products"),
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.products}</span>
        ),
      },
    ],
    [t],
  );

  const subcategoryColumns = useMemo<ColumnDef<CatalogSubcategory>[]>(
    () => [
      { accessorKey: "name", header: t("catalogs.col.name") },
      { accessorKey: "category", header: t("catalogs.col.category") },
      {
        accessorKey: "products",
        header: t("catalogs.col.products"),
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.products}</span>
        ),
      },
    ],
    [t],
  );

  const priceColumns = useMemo<ColumnDef<PriceRule>[]>(
    () => [
      { accessorKey: "name", header: t("catalogs.col.rule") },
      { accessorKey: "scope", header: t("catalogs.col.scope") },
      {
        accessorKey: "adjustment",
        header: t("catalogs.col.adjustment"),
        cell: ({ row }) => (
          <span className="font-body text-label-bold text-status-available">
            {row.original.adjustment}
          </span>
        ),
      },
    ],
    [t],
  );

  const promotionColumns = useMemo<ColumnDef<Promotion>[]>(
    () => [
      {
        accessorKey: "code",
        header: t("catalogs.col.code"),
        cell: ({ row }) => (
          <span className="font-body text-label-bold">{row.original.code}</span>
        ),
      },
      { accessorKey: "description", header: t("catalogs.col.description") },
      { accessorKey: "discount", header: t("catalogs.col.discount") },
      {
        accessorKey: "active",
        header: t("catalogs.col.status"),
        cell: ({ row }) => (
          <StatusBadge tone={row.original.active ? "success" : "neutral"}>
            {t(row.original.active ? "catalogs.active" : "catalogs.inactive")}
          </StatusBadge>
        ),
      },
    ],
    [t],
  );

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-stack-lg">
      <div className="flex flex-wrap gap-stack-sm border-b-2 border-outline-variant">
        {TABS.map(({ key, labelKey }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={`-mb-0.5 border-b-2 px-stack-md py-stack-sm font-heading text-headline-md uppercase tracking-wide transition ${
              tab === key
                ? "border-accent text-on-surface"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {isPending ? (
        <Skeleton className="h-80" />
      ) : (
        <>
          {tab === "categories" && (
            <DataTable columns={categoryColumns} data={data.categories} />
          )}
          {tab === "subcategories" && (
            <DataTable columns={subcategoryColumns} data={data.subcategories} />
          )}
          {tab === "prices" && (
            <DataTable columns={priceColumns} data={data.prices} />
          )}
          {tab === "promotions" && (
            <DataTable columns={promotionColumns} data={data.promotions} />
          )}
        </>
      )}
    </div>
  );
}
