import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import type { CatalogItem } from "@myapp/shared";
import { useGeneralCatalogs } from "../services/queries";
import { DataTable } from "../components/DataTable";
import { Skeleton } from "../../../components/Skeleton";
import { ErrorState } from "../../../components/ErrorState";

export default function Catalogs() {
  const { t } = useTranslation("crm");
  const { data, isPending, isError, refetch } = useGeneralCatalogs();

  const columns = useMemo<ColumnDef<CatalogItem>[]>(
    () => [
      { accessorKey: "name", header: t("catalogs.col.name") },
      {
        accessorKey: "itemCount",
        header: t("catalogs.col.itemCount"),
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.itemCount}</span>
        ),
      },
    ],
    [t],
  );

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-stack-lg">
      <h2 className="font-heading text-headline-lg text-on-surface">
        {t("catalogs.tabs.general")}
      </h2>

      {isPending ? (
        <Skeleton className="h-80" />
      ) : (
        <DataTable columns={columns} data={data?.data ?? []} />
      )}
    </div>
  );
}
