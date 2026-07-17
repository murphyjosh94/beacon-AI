export const PUBLIC_SEARCH_CATEGORIES = [
  "products",
  "hotels",
  "flights",
  "entertainment",
  "vehicles",
  "services",
  "recommendations",
] as const;

export type PublicSearchCategory =
  (typeof PUBLIC_SEARCH_CATEGORIES)[number];

const CATEGORY_LABELS: Record<
  PublicSearchCategory,
  string
> = {
  products: "Products",
  hotels: "Hotels",
  flights: "Flights",
  entertainment: "Entertainment",
  vehicles: "Vehicles",
  services: "Services",
  recommendations: "Recommendations",
};

export function normaliseSearchQuery(
  value: string
): string {
  return value
    .replace(/\s+/g, " ")
    .trim();
}

export function slugifySearch(
  value: string
): string {
  const slug = normaliseSearchQuery(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "");

  return slug.slice(0, 120) || "recommendations";
}

export function isPublicSearchCategory(
  value: string
): value is PublicSearchCategory {
  return PUBLIC_SEARCH_CATEGORIES.includes(
    value as PublicSearchCategory
  );
}

export function normalisePublicCategory(
  value: string | null | undefined
): PublicSearchCategory {
  switch (value) {
    case "product":
    case "products":
    case "shopping":
      return "products";

    case "hotel":
    case "hotels":
    case "holiday":
    case "holidays":
    case "travel":
      return "hotels";

    case "flight":
    case "flights":
      return "flights";

    case "experience":
    case "experiences":
    case "entertainment":
      return "entertainment";

    case "vehicle":
    case "vehicles":
    case "vehicle_parts":
    case "automotive":
    case "car_parts":
      return "vehicles";

    case "service":
    case "services":
      return "services";

    default:
      return "recommendations";
  }
}

export function getPublicCategoryLabel(
  category: PublicSearchCategory
): string {
  return CATEGORY_LABELS[category];
}

export function buildSearchPath(
  category: PublicSearchCategory,
  slug: string
): string {
  return `/search/${category}/${slug}`;
}

export function createSearchPageTitle(
  query: string
): string {
  const cleaned = normaliseSearchQuery(query);
  const lower = cleaned.toLowerCase();

  if (
    lower.startsWith("best ") ||
    lower.startsWith("top ") ||
    lower.startsWith("compare ")
  ) {
    return cleaned;
  }

  return `Best ${cleaned}`;
}

export function createSearchPageDescription(
  query: string
): string {
  const cleaned = normaliseSearchQuery(query);

  return (
    `Compare five personalised recommendations for ${cleaned} with ` +
    "transparent Beacon Scores, trusted sources and live pricing where available."
  ).slice(0, 160);
}