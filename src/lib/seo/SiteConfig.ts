export const siteConfig = {
  name: "Beacon AI",
  officialName: "Beacon-AI",
  url: "https://beacon-ai.co.uk",

  description:
    "Beacon AI helps you discover and compare products, hotels, getaways, entertainment and useful offers through personalised AI-powered recommendations.",

  shortDescription:
    "Personalised AI-powered recommendations for smarter shopping, travel and entertainment choices.",

  locale: "en_GB",
  language: "en-GB",

  logo: "/images/logo.svg",
  socialImage: "/images/beacon-logo.png",

  themeColor: "#0f172a",

  keywords: [
  "Beacon AI",
  "Beacon-AI",

  "AI recommendations",
  "AI recommendation engine",
  "AI shopping assistant",
  "AI travel assistant",
  "AI holiday planner",

  "product recommendations",
  "shopping recommendations",
  "best products",
  "product comparison",

  "hotel recommendations",
  "hotel comparison",
  "holiday recommendations",
  "travel recommendations",
  "flight recommendations",

  "vehicle parts finder",
  "car parts recommendations",
  "vehicle compatibility",

  "local experiences",
  "entertainment recommendations",
  "things to do",

  "personalised recommendations",
  "consumer recommendations",
  "independent product research",
],

  publicRoutes: [
    "/",
    "/membership",
  ],

  privateRoutes: [
    "/account",
    "/api",
    "/checkout",
    "/dashboard",
    "/login",
    "/my-beacon",
    "/register",
    "/settings",
  ],
} as const;

export function absoluteUrl(path = "/"): string {
  return new URL(path, siteConfig.url).toString();
}