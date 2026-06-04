import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MdArrowForward } from "react-icons/md";
import { useCategories } from "../services/queries";
import { CATEGORY_ICONS } from "../data/icons";
import { Skeleton } from "./Skeleton";
import { ErrorState } from "./ErrorState";

/**
 * Icon-led category tiles — the primary "browse by department" entry point on
 * the home page. Shares the cached categories query with the sidebar.
 */
export function CategoryGrid() {
  const { t } = useTranslation("ecommerce");
  const { data: categories, isPending, isError, refetch } = useCategories();

  return (
    <section aria-labelledby="categories-heading">
      <h2
        id="categories-heading"
        className="font-heading text-headline-lg uppercase tracking-wide text-on-surface"
      >
        {t("categories.title")}
      </h2>

      {isError ? (
        <div className="mt-stack-lg">
          <ErrorState onRetry={refetch} />
        </div>
      ) : (
        <div className="mt-stack-lg grid grid-cols-2 gap-gutter sm:grid-cols-3">
          {isPending
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44" />
              ))
            : categories.map(({ slug, labelKey, iconKey, count }) => {
                const Icon = CATEGORY_ICONS[iconKey];
                return (
                  <Link
                    key={slug}
                    to={`/ecommerce/${slug}`}
                    className="group flex flex-col gap-stack-md border-2 border-outline-variant bg-surface p-stack-lg text-on-surface transition hover:border-on-surface hover:shadow-panel"
                  >
                    <Icon aria-hidden size={40} className="text-accent" />
                    <div>
                      <h3 className="font-heading text-headline-md uppercase tracking-wide">
                        {t(labelKey)}
                      </h3>
                      <p className="mt-stack-xs font-body text-label-sm uppercase tracking-widest text-on-surface-variant">
                        {t("categories.count", { count })}
                      </p>
                    </div>
                    <span className="mt-auto inline-flex items-center gap-stack-xs font-body text-label-bold uppercase tracking-wide text-secondary">
                      {t("categories.browse")}
                      <MdArrowForward
                        aria-hidden
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </Link>
                );
              })}
        </div>
      )}
    </section>
  );
}
