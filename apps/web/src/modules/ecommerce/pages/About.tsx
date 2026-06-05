import { useTranslation } from "react-i18next";
import { MdRocketLaunch, MdVisibility } from "react-icons/md";
import heroImage from "../../../assets/hero.png";
import { Eyebrow } from "../components/Eyebrow";
import { SectionHeading } from "../components/SectionHeading";
import { InfoCard } from "../components/InfoCard";
import { StatItem } from "../components/StatItem";
import { TeamMemberCard } from "../components/TeamMemberCard";
import { CtaBanner } from "../components/CtaBanner";
import { ABOUT_STATS, TEAM_MEMBERS } from "../data/about";

/**
 * "About us" page (linked from the footer's Company column). Composed entirely
 * from the reusable micro-components in ../components so each block — hero,
 * mission/vision cards, stats band, team grid, CTA — can be lifted elsewhere.
 */
export default function About() {
  const { t } = useTranslation("ecommerce");

  return (
    <div className="space-y-stack-xl pb-stack-xl">
      {/* Hero ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-container px-margin-mobile pt-stack-xl text-center md:px-margin-desktop">
        <Eyebrow>{t("about.hero.eyebrow")}</Eyebrow>
        <h1 className="mx-auto mt-stack-md max-w-3xl font-display text-display-lg text-on-surface">
          {t("about.hero.title")}
        </h1>
        <div className="mt-stack-lg overflow-hidden border-2 border-on-surface">
          <img
            src={heroImage}
            alt=""
            className="h-[300px] w-full object-cover md:h-[480px]"
          />
        </div>
      </section>

      {/* Mission & Vision ───────────────────────────────── */}
      <section className="mx-auto grid max-w-container gap-gutter px-margin-mobile md:grid-cols-2 md:px-margin-desktop">
        <InfoCard
          icon={MdRocketLaunch}
          tone="secondary"
          title={t("about.mission.title")}
          body={t("about.mission.body")}
        />
        <InfoCard
          icon={MdVisibility}
          tone="primary"
          title={t("about.vision.title")}
          body={t("about.vision.body")}
        />
      </section>

      {/* Stats band (full-bleed) ────────────────────────── */}
      <section className="border-y-2 border-outline-variant bg-surface-lowest py-stack-xl">
        <div className="mx-auto grid max-w-container grid-cols-2 gap-stack-lg px-margin-mobile md:grid-cols-4 md:px-margin-desktop">
          {ABOUT_STATS.map((stat) => (
            <StatItem
              key={stat.labelKey}
              value={stat.value}
              label={t(stat.labelKey)}
            />
          ))}
        </div>
      </section>

      {/* Team ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-container px-margin-mobile md:px-margin-desktop">
        <SectionHeading
          align="center"
          eyebrow={t("about.team.eyebrow")}
          title={t("about.team.title")}
          subtitle={t("about.team.subtitle")}
          className="mb-stack-xl"
        />
        <div className="grid gap-gutter md:grid-cols-3">
          {TEAM_MEMBERS.map((member) => (
            <TeamMemberCard
              key={member.name}
              name={member.name}
              role={t(member.roleKey)}
              imageSrc={member.imageSrc}
              email={member.email}
            />
          ))}
        </div>
      </section>

      {/* CTA ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-container px-margin-mobile md:px-margin-desktop">
        <CtaBanner
          title={t("about.cta.title")}
          buttonLabel={t("about.cta.button")}
          to="/ecommerce/products"
        />
      </section>
    </div>
  );
}
