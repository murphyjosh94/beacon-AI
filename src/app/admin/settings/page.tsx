import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { eq, sql } from "drizzle-orm";

import BeaconFooter from "@/components/BeaconFooter";
import Navbar from "@/components/Navbar";
import DashboardSignOutButton from "@/components/dashboard/DashboardSignOutButton";

import { auth } from "@/lib/auth/Auth";
import { database } from "@/lib/database/Database";
import { user } from "@/lib/database/schema";

export const dynamic = "force-dynamic";

type AdminSettingsPageProps = {
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
};

type SettingDefinition = {
  key: string;
  label: string;
  description: string;
  category: "credits" | "platform" | "communication" | "support";
  type: "number" | "boolean" | "text" | "textarea";
  defaultValue: string;
  minimum?: number;
  maximum?: number;
  placeholder?: string;
};

type StoredSettingRow = {
  setting_key: string;
  setting_value: string;
};

const SETTINGS: SettingDefinition[] = [
  {
    key: "daily_free_credits",
    label: "Daily free credits",
    description:
      "The number of free search credits a standard account receives each day.",
    category: "credits",
    type: "number",
    defaultValue: "3",
    minimum: 0,
    maximum: 1000,
  },
  {
    key: "beacon_plus_daily_credits",
    label: "Beacon+ daily credits",
    description:
      "The number of daily search credits available to an active Beacon+ member.",
    category: "credits",
    type: "number",
    defaultValue: "25",
    minimum: 0,
    maximum: 10000,
  },
  {
    key: "maximum_purchased_credits",
    label: "Maximum purchased credits",
    description:
      "The maximum purchased-credit balance that one account may hold.",
    category: "credits",
    type: "number",
    defaultValue: "10000",
    minimum: 0,
    maximum: 10000000,
  },
  {
    key: "search_credit_cost",
    label: "Credits per search",
    description:
      "The number of credits charged for a completed search that requires payment.",
    category: "credits",
    type: "number",
    defaultValue: "1",
    minimum: 0,
    maximum: 1000,
  },
  {
    key: "search_timeout_seconds",
    label: "Search timeout",
    description:
      "The maximum time, in seconds, that a search may run before timing out.",
    category: "platform",
    type: "number",
    defaultValue: "90",
    minimum: 10,
    maximum: 900,
  },
  {
    key: "maintenance_mode",
    label: "Maintenance mode",
    description:
      "Temporarily restrict normal platform access while maintenance is performed.",
    category: "platform",
    type: "boolean",
    defaultValue: "false",
  },
  {
    key: "registrations_enabled",
    label: "New registrations",
    description:
      "Allow new visitors to create Beacon accounts.",
    category: "platform",
    type: "boolean",
    defaultValue: "true",
  },
  {
    key: "searches_enabled",
    label: "Searches enabled",
    description:
      "Allow members to submit new searches across the platform.",
    category: "platform",
    type: "boolean",
    defaultValue: "true",
  },
  {
    key: "announcement_enabled",
    label: "Announcement banner",
    description:
      "Show or hide the platform-wide announcement message.",
    category: "communication",
    type: "boolean",
    defaultValue: "false",
  },
  {
    key: "announcement_message",
    label: "Announcement message",
    description:
      "The message displayed in the platform-wide announcement banner.",
    category: "communication",
    type: "textarea",
    defaultValue: "",
    placeholder:
      "Example: Beacon will undergo scheduled maintenance tonight at 11:00 PM.",
  },
  {
    key: "homepage_notice",
    label: "Homepage notice",
    description:
      "An optional notice that can be displayed prominently on the public homepage.",
    category: "communication",
    type: "textarea",
    defaultValue: "",
    placeholder: "Enter an optional homepage notice.",
  },
  {
    key: "support_email",
    label: "Support email",
    description:
      "The public email address members should use when requesting assistance.",
    category: "support",
    type: "text",
    defaultValue: "",
    placeholder: "support@example.com",
  },
  {
    key: "support_message",
    label: "Support message",
    description:
      "A short message displayed alongside Beacon support information.",
    category: "support",
    type: "textarea",
    defaultValue:
      "Contact our support team and we will respond as soon as possible.",
    placeholder: "Enter the support message shown to members.",
  },
];

const CATEGORY_DETAILS = {
  credits: {
    eyebrow: "Credit Configuration",
    title: "Credits and usage",
    description:
      "Control daily allowances, search charges and purchased-credit limits.",
  },
  platform: {
    eyebrow: "Platform Controls",
    title: "Availability and access",
    description:
      "Control registrations, searches, maintenance mode and operational limits.",
  },
  communication: {
    eyebrow: "Communication",
    title: "Platform notices",
    description:
      "Manage announcement banners and public notices shown across Beacon.",
  },
  support: {
    eyebrow: "Member Support",
    title: "Support information",
    description:
      "Configure the contact information and guidance presented to members.",
  },
} as const;

async function ensureSettingsTable(): Promise<void> {
  await database.execute(sql`
    create table if not exists beacon_admin_settings (
      setting_key text primary key,
      setting_value text not null,
      updated_at timestamp with time zone not null default now(),
      updated_by text
    )
  `);
}

async function requireAdministrator(): Promise<{
  id: string;
  name: string;
  email: string;
}> {
  const requestHeaders = await headers();

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session?.user?.id) {
    redirect("/signin?next=/admin/settings");
  }

  const administratorRows = await database
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  const administrator = administratorRows[0];

  if (!administrator || administrator.role !== "admin") {
    redirect("/dashboard");
  }

  return {
    id: administrator.id,
    name: administrator.name,
    email: administrator.email,
  };
}

async function saveAdminSettings(formData: FormData): Promise<void> {
  "use server";

  const administrator = await requireAdministrator();

  try {
    await ensureSettingsTable();

    for (const setting of SETTINGS) {
      let value = "";

      if (setting.type === "boolean") {
        value = formData.get(setting.key) === "on" ? "true" : "false";
      } else {
        value = String(formData.get(setting.key) ?? "").trim();
      }

      if (setting.type === "number") {
        const numericValue = Number(value);

        if (!Number.isFinite(numericValue)) {
          redirect(
            `/admin/settings?error=${encodeURIComponent(
              `${setting.label} must be a valid number.`
            )}`
          );
        }

        if (
          setting.minimum !== undefined &&
          numericValue < setting.minimum
        ) {
          redirect(
            `/admin/settings?error=${encodeURIComponent(
              `${setting.label} cannot be lower than ${setting.minimum}.`
            )}`
          );
        }

        if (
          setting.maximum !== undefined &&
          numericValue > setting.maximum
        ) {
          redirect(
            `/admin/settings?error=${encodeURIComponent(
              `${setting.label} cannot be higher than ${setting.maximum}.`
            )}`
          );
        }

        value = String(Math.trunc(numericValue));
      }

      if (setting.key === "support_email" && value.length > 0) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(value)) {
          redirect(
            `/admin/settings?error=${encodeURIComponent(
              "The support email address is not valid."
            )}`
          );
        }
      }

      if (value.length > 5000) {
        redirect(
          `/admin/settings?error=${encodeURIComponent(
            `${setting.label} is too long.`
          )}`
        );
      }

      await database.execute(sql`
        insert into beacon_admin_settings (
          setting_key,
          setting_value,
          updated_at,
          updated_by
        )
        values (
          ${setting.key},
          ${value},
          now(),
          ${administrator.id}
        )
        on conflict (setting_key)
        do update set
          setting_value = excluded.setting_value,
          updated_at = now(),
          updated_by = excluded.updated_by
      `);
    }

    revalidatePath("/admin/settings");
    revalidatePath("/");
    revalidatePath("/dashboard");

    redirect("/admin/settings?saved=true");
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "NEXT_REDIRECT"
    ) {
      throw error;
    }

    console.error("Unable to save Beacon admin settings:", error);

    redirect(
      `/admin/settings?error=${encodeURIComponent(
        "Beacon could not save the settings. Please try again."
      )}`
    );
  }
}

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "Administrator";
}

function getSettingValue(
  storedValues: Map<string, string>,
  definition: SettingDefinition
): string {
  return storedValues.get(definition.key) ?? definition.defaultValue;
}

export default async function AdminSettingsPage({
  searchParams,
}: AdminSettingsPageProps) {
  const administrator = await requireAdministrator();
  const resolvedSearchParams = await searchParams;

  await ensureSettingsTable();

  const settingsResult = await database.execute(sql`
    select
      setting_key,
      setting_value
    from beacon_admin_settings
  `);

  const storedRows = Array.from(
    settingsResult as unknown as Iterable<StoredSettingRow>
  );

  const storedValues = new Map<string, string>(
    storedRows.map((row) => [row.setting_key, row.setting_value])
  );

  const maintenanceMode =
    getSettingValue(
      storedValues,
      SETTINGS.find((setting) => setting.key === "maintenance_mode")!
    ) === "true";

  const registrationsEnabled =
    getSettingValue(
      storedValues,
      SETTINGS.find(
        (setting) => setting.key === "registrations_enabled"
      )!
    ) === "true";

  const searchesEnabled =
    getSettingValue(
      storedValues,
      SETTINGS.find((setting) => setting.key === "searches_enabled")!
    ) === "true";

  const administratorFirstName = getFirstName(administrator.name);

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />

      <section className="relative overflow-hidden bg-slate-950 px-6 py-10 text-white sm:py-14">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-slate-950 to-indigo-950" />
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-red-600/20 blur-3xl" />
        <div className="absolute -bottom-36 left-1/4 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm font-extrabold text-red-200 transition hover:text-white"
              >
                ← Back to admin dashboard
              </Link>

              <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.28em] text-red-200">
                Beacon Administration
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                Site settings
              </h1>

              <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-200">
                Configure Beacon’s credits, availability, announcements and
                support information without changing application code.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Admin Dashboard
              </Link>

              <DashboardSignOutButton />
            </div>
          </div>

          <p className="mt-8 text-sm font-semibold text-slate-300">
            Signed in as administrator{" "}
            <span className="font-black text-white">
              {administratorFirstName}
            </span>
          </p>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-7xl">
          {resolvedSearchParams.saved === "true" && (
            <div
              role="status"
              className="mb-7 rounded-2xl border border-emerald-300 bg-emerald-50 px-6 py-5 text-emerald-950 shadow-sm"
            >
              <p className="font-black">Settings saved successfully</p>
              <p className="mt-1 text-sm font-semibold">
                Beacon’s administrative configuration has been updated.
              </p>
            </div>
          )}

          {resolvedSearchParams.error && (
            <div
              role="alert"
              className="mb-7 rounded-2xl border border-red-300 bg-red-50 px-6 py-5 text-red-950 shadow-sm"
            >
              <p className="font-black">Settings were not saved</p>
              <p className="mt-1 text-sm font-semibold">
                {resolvedSearchParams.error}
              </p>
            </div>
          )}

          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatusCard
              label="Maintenance mode"
              value={maintenanceMode ? "Enabled" : "Disabled"}
              detail={
                maintenanceMode
                  ? "Beacon is currently marked for maintenance."
                  : "Beacon is operating normally."
              }
              enabled={!maintenanceMode}
            />

            <StatusCard
              label="Registrations"
              value={registrationsEnabled ? "Open" : "Closed"}
              detail={
                registrationsEnabled
                  ? "New accounts may be created."
                  : "New account registration is disabled."
              }
              enabled={registrationsEnabled}
            />

            <StatusCard
              label="Searches"
              value={searchesEnabled ? "Enabled" : "Disabled"}
              detail={
                searchesEnabled
                  ? "Members may submit new searches."
                  : "New search submissions are disabled."
              }
              enabled={searchesEnabled}
            />

            <StatusCard
              label="Stripe environment"
              value={
                process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")
                  ? "Live"
                  : "Test"
              }
              detail="Detected from the configured Stripe secret key."
              enabled={
                process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ??
                false
              }
            />
          </section>

          <form action={saveAdminSettings} className="mt-8 space-y-8">
            {(
              [
                "credits",
                "platform",
                "communication",
                "support",
              ] as const
            ).map((category) => {
              const details = CATEGORY_DETAILS[category];
              const categorySettings = SETTINGS.filter(
                (setting) => setting.category === category
              );

              return (
                <section
                  key={category}
                  className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
                >
                  <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
                    <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-blue-700">
                      {details.eyebrow}
                    </p>

                    <h2 className="mt-2 text-2xl font-black text-slate-950">
                      {details.title}
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      {details.description}
                    </p>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {categorySettings.map((setting) => {
                      const currentValue = getSettingValue(
                        storedValues,
                        setting
                      );

                      return (
                        <SettingField
                          key={setting.key}
                          setting={setting}
                          currentValue={currentValue}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })}

            <section className="sticky bottom-4 z-20 rounded-[2rem] border border-slate-300 bg-white/95 p-5 shadow-2xl backdrop-blur sm:p-6">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Save site settings
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Changes are stored immediately after you press save.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/admin"
                    className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-extrabold text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    className="rounded-xl bg-violet-800 px-7 py-3 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-violet-700"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </section>
          </form>

          <section className="mt-8 rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-800">
              Important
            </p>

            <h2 className="mt-2 text-xl font-black text-amber-950">
              Settings must also be read by their corresponding features
            </h2>

            <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-amber-950">
              This page stores the configuration in Beacon’s database. Each
              setting will affect the public application after the relevant
              registration, credit, search, announcement or support component
              reads its saved value.
            </p>
          </section>
        </div>
      </section>

      <BeaconFooter />
    </main>
  );
}

type SettingFieldProps = {
  setting: SettingDefinition;
  currentValue: string;
};

function SettingField({
  setting,
  currentValue,
}: SettingFieldProps) {
  if (setting.type === "boolean") {
    return (
      <div className="grid gap-5 px-6 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
        <div>
          <label
            htmlFor={setting.key}
            className="text-base font-black text-slate-950"
          >
            {setting.label}
          </label>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            {setting.description}
          </p>
        </div>

        <label
          htmlFor={setting.key}
          className="flex min-h-14 cursor-pointer items-center justify-between rounded-xl border border-slate-300 bg-slate-50 px-4"
        >
          <span className="text-sm font-extrabold text-slate-700">
            Enabled
          </span>

          <input
            id={setting.key}
            name={setting.key}
            type="checkbox"
            defaultChecked={currentValue === "true"}
            className="h-6 w-6 cursor-pointer rounded border-slate-400 text-violet-700 focus:ring-violet-600"
          />
        </label>
      </div>
    );
  }

  return (
    <div className="grid gap-5 px-6 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] lg:items-start">
      <div>
        <label
          htmlFor={setting.key}
          className="text-base font-black text-slate-950"
        >
          {setting.label}
        </label>

        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
          {setting.description}
        </p>
      </div>

      {setting.type === "textarea" ? (
        <textarea
          id={setting.key}
          name={setting.key}
          rows={4}
          maxLength={5000}
          defaultValue={currentValue}
          placeholder={setting.placeholder}
          className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
        />
      ) : (
        <input
          id={setting.key}
          name={setting.key}
          type={setting.type}
          min={setting.minimum}
          max={setting.maximum}
          step={setting.type === "number" ? 1 : undefined}
          defaultValue={currentValue}
          placeholder={setting.placeholder}
          className="min-h-14 w-full rounded-xl border border-slate-300 px-4 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
        />
      )}
    </div>
  );
}

type StatusCardProps = {
  label: string;
  value: string;
  detail: string;
  enabled: boolean;
};

function StatusCard({
  label,
  value,
  detail,
  enabled,
}: StatusCardProps) {
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div
        className={`px-6 py-4 text-white ${
          enabled
            ? "bg-gradient-to-r from-emerald-700 to-emerald-900"
            : "bg-gradient-to-r from-slate-700 to-slate-900"
        }`}
      >
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/80">
          {label}
        </p>
      </div>

      <div className="p-6">
        <p className="text-3xl font-black text-slate-950">{value}</p>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {detail}
        </p>
      </div>
    </article>
  );
}