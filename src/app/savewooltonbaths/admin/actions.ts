"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

import { requireAdministratorAccount } from "@/lib/auth/AdminAccess";

type SupportStatus =
  | "new"
  | "reviewing"
  | "contacted"
  | "confirmed"
  | "completed"
  | "declined"
  | "archived";

const ALLOWED_STATUSES = new Set<SupportStatus>([
  "new",
  "reviewing",
  "contacted",
  "confirmed",
  "completed",
  "declined",
  "archived",
]);

function cleanEnvironmentValue(
  value: string | undefined,
  variableName?: string,
): string {
  let cleaned = (value ?? "").trim();

  cleaned = cleaned.replace(/^["']+|["']+$/g, "").trim();

  if (variableName) {
    const prefix = `${variableName}=`;

    if (
      cleaned
        .toLowerCase()
        .startsWith(prefix.toLowerCase())
    ) {
      cleaned = cleaned.slice(prefix.length).trim();
      cleaned = cleaned.replace(/^["']+|["']+$/g, "").trim();
    }
  }

  return cleaned;
}

function getSupabaseAdmin() {
  const supabaseUrl = cleanEnvironmentValue(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL",
  );

  const serviceRoleKey = cleanEnvironmentValue(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    "SUPABASE_SERVICE_ROLE_KEY",
  );

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not configured.",
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured.",
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    console.error(
      "[Save Woolton Baths Admin] Invalid Supabase URL format.",
      {
        valueLength: supabaseUrl.length,
        startsWithHttp:
          supabaseUrl.startsWith("http://") ||
          supabaseUrl.startsWith("https://"),
      },
    );

    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not a valid HTTP or HTTPS URL.",
    );
  }

  if (
    parsedUrl.protocol !== "https:" &&
    parsedUrl.protocol !== "http:"
  ) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must use HTTP or HTTPS.",
    );
  }

  return createClient(
    parsedUrl.toString(),
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

function readString(
  value: FormDataEntryValue | null,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);
}

function readUuid(
  value: FormDataEntryValue | null,
): string {
  const candidate = readString(
    value,
    100,
  );

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      candidate,
    )
  ) {
    throw new Error(
      "Invalid registration identifier.",
    );
  }

  return candidate;
}

function readStatus(
  value: FormDataEntryValue | null,
): SupportStatus {
  const candidate = readString(
    value,
    30,
  ) as SupportStatus;

  if (!ALLOWED_STATUSES.has(candidate)) {
    throw new Error(
      "Invalid support status.",
    );
  }

  return candidate;
}

function emptyToNull(
  value: string,
): string | null {
  return value.length > 0
    ? value
    : null;
}

function revalidateAdminPages() {
  revalidatePath(
    "/savewooltonbaths/admin",
  );

  revalidatePath(
    "/admin",
  );
}

export async function updateWooltonSupportStatus(
  formData: FormData,
) {
  await requireAdministratorAccount();

  const registrationId = readUuid(
    formData.get("registrationId"),
  );

  const status = readStatus(
    formData.get("status"),
  );

  const supabase = getSupabaseAdmin();

  const now = new Date().toISOString();

  const updateValues: {
    status: SupportStatus;
    contacted_at?: string;
    confirmed_at?: string;
  } = {
    status,
  };

  if (status === "contacted") {
    updateValues.contacted_at = now;
  }

  if (status === "confirmed") {
    updateValues.confirmed_at = now;
  }

  const { data, error } = await supabase
    .from("save_woolton_baths_support")
    .update(updateValues)
    .eq("id", registrationId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      "[Save Woolton Baths Admin] Failed to update support status:",
      error,
    );

    throw new Error(
      "Unable to update the registration status.",
    );
  }

  if (!data) {
    throw new Error(
      "The support registration could not be found.",
    );
  }

  revalidateAdminPages();
}

export async function updateWooltonSupportNotes(
  formData: FormData,
) {
  await requireAdministratorAccount();

  const registrationId = readUuid(
    formData.get("registrationId"),
  );

  const internalNotes = readString(
    formData.get("internalNotes"),
    5000,
  );

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("save_woolton_baths_support")
    .update({
      internal_notes:
        emptyToNull(internalNotes),
    })
    .eq("id", registrationId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      "[Save Woolton Baths Admin] Failed to update internal notes:",
      error,
    );

    throw new Error(
      "Unable to save the internal notes.",
    );
  }

  if (!data) {
    throw new Error(
      "The support registration could not be found.",
    );
  }

  revalidateAdminPages();
}

export async function markWooltonSupportContacted(
  formData: FormData,
) {
  await requireAdministratorAccount();

  const registrationId = readUuid(
    formData.get("registrationId"),
  );

  const supabase = getSupabaseAdmin();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("save_woolton_baths_support")
    .update({
      status: "contacted",
      contacted_at: now,
    })
    .eq("id", registrationId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      "[Save Woolton Baths Admin] Failed to mark registration contacted:",
      error,
    );

    throw new Error(
      "Unable to mark the registration as contacted.",
    );
  }

  if (!data) {
    throw new Error(
      "The support registration could not be found.",
    );
  }

  revalidateAdminPages();
}

export async function markWooltonSupportConfirmed(
  formData: FormData,
) {
  await requireAdministratorAccount();

  const registrationId = readUuid(
    formData.get("registrationId"),
  );

  const supabase = getSupabaseAdmin();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("save_woolton_baths_support")
    .update({
      status: "confirmed",
      confirmed_at: now,
    })
    .eq("id", registrationId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      "[Save Woolton Baths Admin] Failed to confirm registration:",
      error,
    );

    throw new Error(
      "Unable to confirm the registration.",
    );
  }

  if (!data) {
    throw new Error(
      "The support registration could not be found.",
    );
  }

  revalidateAdminPages();
}

export async function archiveWooltonSupportRegistration(
  formData: FormData,
) {
  await requireAdministratorAccount();

  const registrationId = readUuid(
    formData.get("registrationId"),
  );

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("save_woolton_baths_support")
    .update({
      status: "archived",
    })
    .eq("id", registrationId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      "[Save Woolton Baths Admin] Failed to archive registration:",
      error,
    );

    throw new Error(
      "Unable to archive the registration.",
    );
  }

  if (!data) {
    throw new Error(
      "The support registration could not be found.",
    );
  }

  revalidateAdminPages();
}