import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCategories } from "../services/queries";
import { CATEGORY_ICONS } from "../data/icons";
import { Skeleton } from "../../../components/Skeleton";
import { ErrorState } from "../../../components/ErrorState";

/**
 * Left-hand category rail. Sticks below the navbar on desktop; on mobile it
 * collapses into a horizontally scrollable strip above the page content.
 * Data comes from the catalog API via React Query.
 */
export function CategorySidebar() {
  const { t } = useTranslation("ecommerce");
  const { data: categories, isPending, isError, refetch } = useCategories();

  return (
    <aside className="lg:w-64 lg:shrink-0">
      <h2 className="font-heading text-headline-md uppercase tracking-wide text-on-surface">
        {t("sidebar.title")}
      </h2>

      {isError ? (
        <div className="mt-stack-md">
          <ErrorState onRetry={refetch} />
        </div>
      ) : (
        <nav className="mt-stack-md flex gap-stack-sm overflow-x-auto pb-stack-sm lg:flex-col lg:overflow-visible lg:pb-0">
          {isPending
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-40 shrink-0 lg:w-full" />
              ))
            : categories.map(({ slug, labelKey, iconKey, count }) => {
                const Icon = CATEGORY_ICONS[iconKey];
                return (
                  <NavLink
                    key={slug}
                    to={`/ecommerce/${slug}`}
                    className={({ isActive }) =>
                      `group flex shrink-0 items-center gap-stack-sm border-2 px-stack-md py-stack-sm transition ${
                        isActive
                          ? "border-on-surface bg-primary text-on-primary"
                          : "border-outline-variant bg-surface text-on-surface hover:border-on-surface hover:shadow-pressed"
                      }`
                    }
                  >
                    <Icon aria-hidden size={22} className="text-accent" />
                    <span className="font-body text-label-bold uppercase tracking-wide">
                      {t(labelKey)}
                    </span>
                    <span className="ml-auto hidden font-body text-label-sm opacity-60 lg:inline">
                      {count}
                    </span>
                  </NavLink>
                );
              })}
        </nav>
      )}
    </aside>
  );
}
