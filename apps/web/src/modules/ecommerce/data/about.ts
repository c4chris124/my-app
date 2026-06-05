// Static content for the About page. Copy is resolved through i18n at render
// time (keys under the `ecommerce` namespace, `about.*`); only names and raw
// figures live here. Swap `imageSrc` in once real portraits are available.

export interface TeamMember {
  name: string;
  /** i18n key for the role, e.g. about.team.roles.operations */
  roleKey: string;
  imageSrc?: string;
  email?: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Abigail",
    roleKey: "about.team.roles.operations",
    email: "abigail@rehobot.example",
  },
  {
    name: "Hector",
    roleKey: "about.team.roles.technical",
    email: "hector@rehobot.example",
  },
  {
    name: "Herber",
    roleKey: "about.team.roles.logistics",
    email: "herber@rehobot.example",
  },
];

export interface AboutStat {
  /** Pre-formatted figure, kept verbatim across locales. */
  value: string;
  /** i18n key for the label, e.g. about.stats.years */
  labelKey: string;
}

export const ABOUT_STATS: AboutStat[] = [
  { value: "25+", labelKey: "about.stats.years" },
  { value: "500+", labelKey: "about.stats.projects" },
  { value: "15k", labelKey: "about.stats.units" },
  { value: "24/7", labelKey: "about.stats.support" },
];
