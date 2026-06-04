import { useTranslation } from "react-i18next";
import { CategorySidebar } from "../components/CategorySidebar";
import { CategoryGrid } from "../components/CategoryGrid";
import { RecommendationSection } from "../components/RecommendationSection";
import { TestimonialSection } from "../components/TestimonialSection";
import { FaqSection } from "../components/FaqSection";

/**
 * E-commerce landing page. Layout per spec: a category sidebar with the page
 * content beside it — categories, recommendations, customer proof, and FAQ.
 * The testimonial band is full-bleed; everything else sits in the container.
 */
export default function Home() {
  const { t } = useTranslation("ecommerce");

  return (
    <div className="space-y-stack-xl pb-stack-xl">
      <div className="mx-auto max-w-container space-y-stack-xl px-margin-mobile pt-stack-xl md:px-margin-desktop">
        {/* Hero ───────────────────────────────────────────── */}
        <section>
          <p className="font-body text-label-bold uppercase tracking-widest text-secondary">
            {t("hero.eyebrow")}
          </p>
          <h1 className="mt-stack-sm font-display text-display-lg text-on-surface">
            {t("hero.title")}
          </h1>
          <p className="mt-stack-md max-w-2xl font-body text-body-lg text-on-surface-variant">
            {t("hero.subtitle")}
          </p>
        </section>

        {/* Sidebar + content ──────────────────────────────── */}
        <div className="flex flex-col gap-stack-xl lg:flex-row">
          <CategorySidebar />
          <div className="min-w-0 flex-1 space-y-stack-xl">
            <CategoryGrid />
            <RecommendationSection />
          </div>
        </div>
      </div>

      {/* Full-bleed customer proof band ────────────────────── */}
      <TestimonialSection />

      <div className="mx-auto max-w-container px-margin-mobile md:px-margin-desktop">
        <FaqSection />
      </div>
    </div>
  );
}
