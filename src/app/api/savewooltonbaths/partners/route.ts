import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PublicPartnerCategory =
  | "professional_partners"
  | "heritage_construction"
  | "engineering_energy"
  | "community"
  | "academic"
  | "media_awareness"
  | "public_sector"
  | "other";

type PublicPartnerRow = {
  id: string;
  name: string;
  title: string | null;
  description: string | null;
  public_category: PublicPartnerCategory;
  relationship_type: string | null;
  logo_url: string | null;
  photo_url: string | null;
  website_url: string | null;
  confirmed_partner_since: string | null;
  display_order: number | null;
};

type PublicPartner = {
  id: string;
  name: string;
  title: string | null;
  wording: string | null;
  category: PublicPartnerCategory;
  relationshipType: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  photoUrl: string | null;
  displayOrder: number;
  confirmedPartnerSince: string | null;
};

const PUBLIC_CATEGORIES = new Set<PublicPartnerCategory>([
  "professional_partners",
  "heritage_construction",
  "engineering_energy",
  "community",
  "academic",
  "media_awareness",
  "public_sector",
  "other",
]);

function cleanEnvironmentValue(
  value: string | undefined,
): string {
  if (!value) {
    return "";
  }

  return value
    .trim()
    .replace(/^["']|["']$/g, "");
}

function getSupabaseClient() {
  const url = cleanEnvironmentValue(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );

  const key = cleanEnvironmentValue(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not configured.",
    );
  }

  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured.",
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function isPublicCategory(
  value: unknown,
): value is PublicPartnerCategory {
  return (
    typeof value === "string" &&
    PUBLIC_CATEGORIES.has(
      value as PublicPartnerCategory,
    )
  );
}

function normalisePartner(
  row: PublicPartnerRow,
): PublicPartner | null {
  if (
    !row.id ||
    !row.name ||
    !isPublicCategory(row.public_category)
  ) {
    return null;
  }

  const name = row.name.trim();

  if (!name) {
    return null;
  }

  return {
    id: row.id,

    name,

    title:
      row.title?.trim() ||
      null,

    wording:
      row.description?.trim() ||
      null,

    category:
      row.public_category,

    relationshipType:
      row.relationship_type?.trim() ||
      null,

    websiteUrl:
      row.website_url?.trim() ||
      null,

    logoUrl:
      row.logo_url?.trim() ||
      null,

    photoUrl:
      row.photo_url?.trim() ||
      null,

    displayOrder:
      Number.isFinite(
        Number(row.display_order),
      )
        ? Number(row.display_order)
        : 100,

    confirmedPartnerSince:
      row.confirmed_partner_since,
  };
}

export async function GET() {
  try {
    const supabase =
      getSupabaseClient();

    const {
      data,
      error,
    } = await supabase
      .from("woolton_public_partners")
      .select(
        [
          "id",
          "name",
          "title",
          "description",
          "public_category",
          "relationship_type",
          "logo_url",
          "photo_url",
          "website_url",
          "confirmed_partner_since",
          "display_order",
        ].join(","),
      )
      .order("display_order", {
        ascending: true,
      })
      .order("name", {
        ascending: true,
      });

    if (error) {
      console.error(
        "[Save Woolton Baths partners GET]",
        error,
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Unable to load campaign partners.",
        },
        {
          status: 500,
        },
      );
    }

    const partners =
      (
        (data ??
          []) as unknown as PublicPartnerRow[]
      )
        .map(normalisePartner)
        .filter(
          (
            partner,
          ): partner is PublicPartner =>
            partner !== null,
        );

    return NextResponse.json(
      {
        ok: true,
        partners,
        count: partners.length,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error(
      "[Save Woolton Baths partners GET]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "Unable to load campaign partners.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "Method not allowed.",
    },
    {
      status: 405,
      headers: {
        Allow: "GET",
      },
    },
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      ok: false,
      error: "Method not allowed.",
    },
    {
      status: 405,
      headers: {
        Allow: "GET",
      },
    },
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      ok: false,
      error: "Method not allowed.",
    },
    {
      status: 405,
      headers: {
        Allow: "GET",
      },
    },
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      ok: false,
      error: "Method not allowed.",
    },
    {
      status: 405,
      headers: {
        Allow: "GET",
      },
    },
  );
}