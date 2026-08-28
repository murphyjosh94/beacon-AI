import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PartnershipSummaryRow = {
  total_active: number | string | null;
  contacted: number | string | null;
  responded: number | string | null;
  meetings_arranged: number | string | null;
  support_in_principle: number | string | null;
  offers_received: number | string | null;
  confirmed_partners: number | string | null;
};

function cleanEnvironmentValue(value: string | undefined): string {
  return (value ?? "").trim().replace(/^["']|["']$/g, "");
}

function getSupabaseAdmin() {
  const url = cleanEnvironmentValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = cleanEnvironmentValue(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server environment is not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const [{ data: summary, error: summaryError }, professionalSupportResult] =
      await Promise.all([
        supabase
          .from("woolton_partnership_summary")
          .select(
            "total_active, contacted, responded, meetings_arranged, support_in_principle, offers_received, confirmed_partners",
          )
          .single<PartnershipSummaryRow>(),
        supabase
          .from("woolton_partnership_registry")
          .select("id", { count: "exact", head: true })
          .eq("archived", false)
          .eq("relationship_type", "professional_support")
          .in("status", [
            "support_in_principle",
            "offer_received",
            "confirmed_partner",
          ]),
      ]);

    if (summaryError) {
      console.error(
        "[savewooltonbaths/partners/network] Summary query failed:",
        summaryError,
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Unable to load campaign network summary.",
        },
        { status: 500 },
      );
    }

    if (professionalSupportResult.error) {
      console.error(
        "[savewooltonbaths/partners/network] Professional support count failed:",
        professionalSupportResult.error,
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Unable to load campaign network summary.",
        },
        { status: 500 },
      );
    }

    const positiveResponses =
      toNumber(summary.responded) +
      toNumber(summary.meetings_arranged) +
      toNumber(summary.support_in_principle) +
      toNumber(summary.offers_received) +
      toNumber(summary.confirmed_partners);

    return NextResponse.json(
      {
        ok: true,
        summary: {
          totalActive: toNumber(summary.total_active),
          positiveResponses,
          professionalSupportOffers: professionalSupportResult.count ?? 0,
          confirmedPartners: toNumber(summary.confirmed_partners),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error(
      "[savewooltonbaths/partners/network] Unexpected error:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error: "Unable to load campaign network summary.",
      },
      { status: 500 },
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Method Not Allowed" },
    { status: 405 },
  );
}

export async function PATCH() {
  return NextResponse.json(
    { ok: false, error: "Method Not Allowed" },
    { status: 405 },
  );
}

export async function PUT() {
  return NextResponse.json(
    { ok: false, error: "Method Not Allowed" },
    { status: 405 },
  );
}

export async function DELETE() {
  return NextResponse.json(
    { ok: false, error: "Method Not Allowed" },
    { status: 405 },
  );
}
