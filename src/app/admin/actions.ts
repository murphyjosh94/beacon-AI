"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import {
  and,
  eq,
  gte,
  sql,
} from "drizzle-orm";

import { auth } from "@/lib/auth/Auth";
import { database } from "@/lib/database/Database";

import {
  creditLedger,
  user,
} from "@/lib/database/schema";

type AdminAccount = {
  id: string;
};

type TargetAccount = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin" | null;
  beaconPlusActive: boolean;
  purchasedCredits: number;
};

const MAXIMUM_CREDIT_ADJUSTMENT =
  100_000;

function readRequiredString(
  value: FormDataEntryValue | null
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function readBooleanValue(
  value: FormDataEntryValue | null
): boolean | null {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

function readRole(
  value: FormDataEntryValue | null
): "user" | "admin" | null {
  if (
    value === "user" ||
    value === "admin"
  ) {
    return value;
  }

  return null;
}

function readCreditAdjustment(
  value: FormDataEntryValue | null
): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned =
    value.trim();

  if (!/^-?\d+$/.test(cleaned)) {
    return null;
  }

  const parsed =
    Number.parseInt(
      cleaned,
      10
    );

  if (
    !Number.isSafeInteger(parsed) ||
    parsed === 0 ||
    Math.abs(parsed) >
      MAXIMUM_CREDIT_ADJUSTMENT
  ) {
    return null;
  }

  return parsed;
}

async function requireAdministrator(): Promise<AdminAccount> {
  const session =
    await auth.api.getSession({
      headers:
        await headers(),
    });

  if (!session?.user?.id) {
    throw new Error(
      "You must be signed in to perform this action."
    );
  }

  const administratorRows =
    await database
      .select({
        id:
          user.id,

        role:
          user.role,
      })
      .from(user)
      .where(
        eq(
          user.id,
          session.user.id
        )
      )
      .limit(1);

  const administrator =
    administratorRows[0];

  if (
    !administrator ||
    administrator.role !== "admin"
  ) {
    throw new Error(
      "Administrator access is required."
    );
  }

  return {
    id:
      administrator.id,
  };
}

async function getTargetAccount(
  userId: string
): Promise<TargetAccount> {
  const accountRows =
    await database
      .select({
        id:
          user.id,

        name:
          user.name,

        email:
          user.email,

        role:
          user.role,

        beaconPlusActive:
          user.beaconPlusActive,

        purchasedCredits:
          user.purchasedCredits,
      })
      .from(user)
      .where(
        eq(
          user.id,
          userId
        )
      )
      .limit(1);

  const account =
    accountRows[0];

  if (!account) {
    throw new Error(
      "The selected Beacon account could not be found."
    );
  }

  return account;
}

function refreshAdminPages(): void {
  revalidatePath(
    "/admin"
  );

  revalidatePath(
    "/dashboard"
  );
}

export async function updateUserMembership(
  formData: FormData
): Promise<void> {
  const administrator =
    await requireAdministrator();

  const userId =
    readRequiredString(
      formData.get(
        "userId"
      )
    );

  const beaconPlusActive =
    readBooleanValue(
      formData.get(
        "beaconPlusActive"
      )
    );

  if (!userId) {
    throw new Error(
      "A user ID is required."
    );
  }

  if (
    beaconPlusActive === null
  ) {
    throw new Error(
      "A valid membership status is required."
    );
  }

  const account =
    await getTargetAccount(
      userId
    );

  if (
    account.beaconPlusActive ===
    beaconPlusActive
  ) {
    return;
  }

  await database
    .update(user)
    .set({
      beaconPlusActive,

      updatedAt:
        new Date(),
    })
    .where(
      eq(
        user.id,
        userId
      )
    );

  console.info(
    "Beacon administrator changed membership status.",
    {
      administratorId:
        administrator.id,

      userId:
        account.id,

      userEmail:
        account.email,

      beaconPlusActive,
    }
  );

  refreshAdminPages();
}

export async function updateUserRole(
  formData: FormData
): Promise<void> {
  const administrator =
    await requireAdministrator();

  const userId =
    readRequiredString(
      formData.get(
        "userId"
      )
    );

  const requestedRole =
    readRole(
      formData.get(
        "role"
      )
    );

  if (!userId) {
    throw new Error(
      "A user ID is required."
    );
  }

  if (!requestedRole) {
    throw new Error(
      "A valid account role is required."
    );
  }

  const account =
    await getTargetAccount(
      userId
    );

  if (
    administrator.id ===
      account.id &&
    requestedRole !== "admin"
  ) {
    throw new Error(
      "You cannot remove your own administrator access."
    );
  }

  if (
    account.role ===
    requestedRole
  ) {
    return;
  }

  await database
    .update(user)
    .set({
      role:
        requestedRole,

      updatedAt:
        new Date(),
    })
    .where(
      eq(
        user.id,
        userId
      )
    );

  console.info(
    "Beacon administrator changed an account role.",
    {
      administratorId:
        administrator.id,

      userId:
        account.id,

      userEmail:
        account.email,

      previousRole:
        account.role,

      requestedRole,
    }
  );

  refreshAdminPages();
}

export async function adjustUserCredits(
  formData: FormData
): Promise<void> {
  const administrator =
    await requireAdministrator();

  const userId =
    readRequiredString(
      formData.get(
        "userId"
      )
    );

  const adjustment =
    readCreditAdjustment(
      formData.get(
        "adjustment"
      )
    );

  const reason =
    readRequiredString(
      formData.get(
        "reason"
      )
    ).slice(
      0,
      300
    );

  if (!userId) {
    throw new Error(
      "A user ID is required."
    );
  }

  if (adjustment === null) {
    throw new Error(
      `Enter a whole-number credit adjustment between -${MAXIMUM_CREDIT_ADJUSTMENT} and ${MAXIMUM_CREDIT_ADJUSTMENT}, excluding zero.`
    );
  }

  const account =
    await getTargetAccount(
      userId
    );

  const description =
    reason ||
    (
      adjustment > 0
        ? `Administrator added ${adjustment} purchased credits.`
        : `Administrator removed ${Math.abs(
            adjustment
          )} purchased credits.`
    );

  await database.transaction(
    async (
      transaction
    ) => {
      const updatedRows =
        adjustment > 0
          ? await transaction
              .update(user)
              .set({
                purchasedCredits:
                  sql`${user.purchasedCredits} + ${adjustment}`,

                updatedAt:
                  new Date(),
              })
              .where(
                eq(
                  user.id,
                  userId
                )
              )
              .returning({
                purchasedCredits:
                  user.purchasedCredits,
              })
          : await transaction
              .update(user)
              .set({
                purchasedCredits:
                  sql`${user.purchasedCredits} + ${adjustment}`,

                updatedAt:
                  new Date(),
              })
              .where(
                and(
                  eq(
                    user.id,
                    userId
                  ),

                  gte(
                    user.purchasedCredits,
                    Math.abs(
                      adjustment
                    )
                  )
                )
              )
              .returning({
                purchasedCredits:
                  user.purchasedCredits,
              });

      const updatedAccount =
        updatedRows[0];

      if (!updatedAccount) {
        throw new Error(
          "The credit adjustment would make the account balance negative."
        );
      }

      await transaction
        .insert(
          creditLedger
        )
        .values({
          userId,

          type:
            "adjustment",

          amount:
            adjustment,

          balanceAfter:
            updatedAccount
              .purchasedCredits,

          description,

          metadata: {
            source:
              "admin_dashboard",

            administratorId:
              administrator.id,

            previousBalance:
              account.purchasedCredits,

            adjustment,
          },
        });
    }
  );

  console.info(
    "Beacon administrator adjusted purchased credits.",
    {
      administratorId:
        administrator.id,

      userId:
        account.id,

      userEmail:
        account.email,

      previousBalance:
        account.purchasedCredits,

      adjustment,
    }
  );

  refreshAdminPages();
}