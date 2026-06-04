import { useTranslation } from "react-i18next";
import { MdFormatQuote } from "react-icons/md";
import { useTestimonials } from "../services/queries";
import { Skeleton } from "./Skeleton";
import { ErrorState } from "./ErrorState";

/**
 * "Our customers" — social proof from previous buyers, fetched via React Query.
 * Inverse-surface band so it reads as a distinct section between products and
 * the FAQ.
 */
export function TestimonialSection() {
  const { t } = useTranslation("ecommerce");
  const { data: testimonials, isPending, isError, refetch } = useTestimonials();

  return (
    <section
      aria-labelledby="customers-heading"
      className="border-y-2 border-on-surface bg-surface-container py-stack-xl"
    >
      <div className="mx-auto max-w-container px-margin-mobile md:px-margin-desktop">
        <h2
          id="customers-heading"
          className="font-heading text-headline-lg uppercase tracking-wide text-on-surface"
        >
          {t("customers.title")}
        </h2>

        {isError ? (
          <div className="mt-stack-lg">
            <ErrorState onRetry={refetch} />
          </div>
        ) : (
          <div className="mt-stack-lg grid grid-cols-1 gap-gutter md:grid-cols-3">
            {isPending
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-56 bg-surface" />
                ))
              : testimonials.map((item) => (
                  <figure
                    key={item.id}
                    className="flex flex-col gap-stack-md border-2 border-outline-variant bg-surface p-stack-lg"
                  >
                    <MdFormatQuote aria-hidden size={32} className="text-accent" />
                    <blockquote className="flex-1 font-body text-body-lg text-on-surface">
                      {item.quote}
                    </blockquote>
                    <figcaption className="border-t border-outline-variant pt-stack-md">
                      <span className="block font-heading text-headline-md uppercase tracking-wide text-on-surface">
                        {item.author}
                      </span>
                      <span className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant">
                        {item.company}
                      </span>
                    </figcaption>
                  </figure>
                ))}
          </div>
        )}
      </div>
    </section>
  );
}
