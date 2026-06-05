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
      {/* Tabs. On mobile (< lg) they become a full-bleed, sticky, horizontally
          scrollable strip (scrollbar hidden) so the four labels never wrap or
          cramp; the negative margin cancels <main>'s padding to reach the screen
          edges. From lg up it reverts to the original static, wrapping bar. */}
      <div className="-mx-margin-mobile sticky top-0 z-30 overflow-x-auto border-b-2 border-outline-variant bg-surface scrollbar-hide lg:static lg:mx-0 lg:overflow-visible lg:bg-transparent">
        <nav className="flex gap-stack-sm px-margin-mobile lg:flex-wrap lg:px-0">
          {TABS.map(({ key, labelKey }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-pressed={active}
                className={`flex shrink-0 flex-col items-center border-b-4 px-6 py-4 transition lg:-mb-0.5 lg:flex-row lg:border-b-2 lg:px-stack-md lg:py-stack-sm ${
                  active
                    ? "border-accent bg-surface-high text-primary lg:bg-transparent lg:text-on-surface"
                    : "border-transparent text-on-surface-variant opacity-70 hover:opacity-100 lg:opacity-100 lg:hover:text-on-surface"
                }`}
              >
                <span
                  className={`font-heading text-headline-md tracking-widest lg:tracking-wide ${
                    active ? "font-bold lg:font-normal" : ""
                  }`}
                >
                  {t(labelKey)}
                </span>
              </button>
            );
          })}
        </nav>
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
