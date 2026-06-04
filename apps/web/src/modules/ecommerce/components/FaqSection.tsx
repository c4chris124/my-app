import { useTranslation } from "react-i18next";
import { MdAdd, MdRemove } from "react-icons/md";
import { useFaq } from "../services/queries";
import { Skeleton } from "../../../components/Skeleton";
import { ErrorState } from "../../../components/ErrorState";

/**
 * Accessible FAQ accordion built on native <details>/<summary> — no JS state,
 * keyboard-operable out of the box. Items fetched via React Query.
 */
export function FaqSection() {
  const { t } = useTranslation("ecommerce");
  const { data: items, isPending, isError, refetch } = useFaq();

  return (
    <section aria-labelledby="faq-heading">
      <h2
        id="faq-heading"
        className="font-heading text-headline-lg uppercase tracking-wide text-on-surface"
      >
        {t("faq.title")}
      </h2>

      {isError ? (
        <div className="mt-stack-lg">
          <ErrorState onRetry={refetch} />
        </div>
      ) : isPending ? (
        <div className="mt-stack-lg space-y-stack-sm">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : (
        <div className="mt-stack-lg divide-y-2 divide-outline-variant border-2 border-outline-variant bg-surface">
          {items.map((item) => (
            <details key={item.id} className="group">
              <summary className="flex cursor-pointer items-center justify-between gap-stack-md p-stack-lg font-heading text-headline-md uppercase tracking-wide text-on-surface marker:content-none hover:bg-surface-container">
                {t(item.questionKey)}
                <MdAdd
                  aria-hidden
                  size={24}
                  className="shrink-0 text-accent group-open:hidden"
                />
                <MdRemove
                  aria-hidden
                  size={24}
                  className="hidden shrink-0 text-accent group-open:block"
                />
              </summary>
              <p className="px-stack-lg pb-stack-lg font-body text-body-md text-on-surface-variant">
                {t(item.answerKey)}
              </p>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
