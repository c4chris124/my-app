import { useTranslation } from "react-i18next";
import { useRecommendedProducts } from "../services/queries";
import { ProductCard } from "./ProductCard";
import { Skeleton } from "../../../components/Skeleton";
import { ErrorState } from "../../../components/ErrorState";

/**
 * "Recommended for you" — a curated row of products fetched from the catalog
 * API. Will become a personalised feed once auth + history exist.
 */
export function RecommendationSection() {
  const { t } = useTranslation("ecommerce");
  const { data: products, isPending, isError, refetch } = useRecommendedProducts();

  return (
    <section aria-labelledby="recommended-heading">
      <div className="flex items-baseline justify-between gap-stack-md">
        <h2
          id="recommended-heading"
          className="font-heading text-headline-lg tracking-wide text-on-surface"
        >
          {t("recommended.title")}
        </h2>
        <p className="hidden font-accent text-accent-text text-secondary sm:block">
          {t("recommended.subtitle")}
        </p>
      </div>

      {isError ? (
        <div className="mt-stack-lg">
          <ErrorState onRetry={refetch} />
        </div>
      ) : (
        <div className="mt-stack-lg grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4">
          {isPending
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-80" />
              ))
            : products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      )}
    </section>
  );
}
