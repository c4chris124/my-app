import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { StatusChip } from "../../../components/StatusChip";
import { Button } from "../../../components/Button";
import { formatPrice } from "../../../utils/format";
import type { Product } from "../data/types";

export function ProductCard({ product }: { product: Product }) {
  const { t, i18n } = useTranslation("ecommerce");
  const locale = i18n.resolvedLanguage ?? "es";
  const soldOut = product.stock === "out";

  return (
    <article className="flex flex-col border-2 border-outline-variant bg-surface text-on-surface transition hover:border-on-surface hover:shadow-panel">
      {/* Image placeholder — sharp industrial panel with the stock chip. */}
      <div className="relative aspect-[4/3] border-b-2 border-outline-variant bg-surface-container">
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center font-display text-display-lg text-outline-variant"
        >
          {product.name.charAt(0)}
        </span>
        <div className="absolute left-stack-sm top-stack-sm">
          <StatusChip state={product.stock} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-stack-sm p-stack-md">
        <h3 className="font-heading text-headline-md uppercase tracking-wide">
          <Link
            to={`/ecommerce/${product.category}/${product.id}`}
            className="hover:text-secondary"
          >
            {product.name}
          </Link>
        </h3>
        <p className="font-body text-body-md text-on-surface-variant">
          {product.blurb}
        </p>
        <div className="mt-auto flex items-center justify-between gap-stack-md pt-stack-sm">
          <span className="font-display text-headline-lg text-on-surface">
            {formatPrice(product.price, product.currency, locale)}
          </span>
          <Button
            variant="primary"
            disabled={soldOut}
            className="h-10 text-headline-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            {soldOut ? t("product.soldOut") : t("product.addToCart")}
          </Button>
        </div>
      </div>
    </article>
  );
}
