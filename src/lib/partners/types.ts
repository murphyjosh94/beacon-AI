export type PartnerCategory =
  | "shopping"
  | "getaways"
  | "entertainment";

export type PartnerOffer = {
  id: string;
  category: PartnerCategory;
  provider: string;
  title: string;
  description: string;
  price?: number;
  priceLabel?: string;
  imageUrl?: string;
  destinationUrl: string;
  features: string[];
  sponsored?: boolean;
};