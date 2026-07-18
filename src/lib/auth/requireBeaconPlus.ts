import "server-only";

import {
  headers,
} from "next/headers";

import {
  redirect,
} from "next/navigation";

import {
  eq,
} from "drizzle-orm";

import { auth } from "@/lib/auth/Auth";
import { database } from "@/lib/database/Database";
import { user } from "@/lib/database/schema";

export type BeaconAccountAccess = {
  userId: string;
  email: string;
  name: string | null;

  beaconPlusActive: boolean;

  beaconPlusCurrentPeriodEnd:
    | Date
    | null;

  stripeCustomerId:
    | string
    | null;

  stripeSubscriptionId:
    | string
    | null;

  stripeSubscriptionStatus:
    | string
    | null;

  purchasedCredits: number;
};

type RequireSignedInOptions = {
  returnTo?: string;
};

type RequireBeaconPlusOptions = {
  returnTo?: string;
  upgradePath?: string;
};

function createSignInUrl(
  returnTo: string
): string {
  const searchParams =
    new URLSearchParams({
      next:
        returnTo,
    });

  return `/signin?${searchParams.toString()}`;
}

function createUpgradeUrl(
  upgradePath: string,
  returnTo: string
): string {
  const searchParams =
    new URLSearchParams({
      required:
        "beacon-plus",

      next:
        returnTo,
    });

  return `${upgradePath}?${searchParams.toString()}`;
}

function isBeaconPlusSubscriptionStatusActive(
  status:
    | string
    | null
): boolean {
  return (
    status === "active" ||
    status === "trialing"
  );
}

function hasCurrentBeaconPlusPeriod(
  currentPeriodEnd:
    | Date
    | null
): boolean {
  if (!currentPeriodEnd) {
    return true;
  }

  return (
    currentPeriodEnd.getTime() >
    Date.now()
  );
}

function hasBeaconPlusAccess(
  account: {
    beaconPlusActive:
      boolean | null;

    stripeSubscriptionStatus:
      string | null;

    beaconPlusCurrentPeriodEnd:
      Date | null;
  }
): boolean {
  if (
    account.beaconPlusActive !==
    true
  ) {
    return false;
  }

  if (
    !isBeaconPlusSubscriptionStatusActive(
      account
        .stripeSubscriptionStatus
    )
  ) {
    return false;
  }

  return hasCurrentBeaconPlusPeriod(
    account
      .beaconPlusCurrentPeriodEnd
  );
}

async function readSessionUserId(): Promise<
  string | null
> {
  const requestHeaders =
    await headers();

  const session =
    await auth.api.getSession({
      headers:
        requestHeaders,
    });

  return (
    session?.user?.id ??
    null
  );
}

async function readAccountAccess(
  userId: string
): Promise<BeaconAccountAccess | null> {
  const accounts =
    await database
      .select({
        userId:
          user.id,

        email:
          user.email,

        name:
          user.name,

        beaconPlusActive:
          user.beaconPlusActive,

        beaconPlusCurrentPeriodEnd:
          user.beaconPlusCurrentPeriodEnd,

        stripeCustomerId:
          user.stripeCustomerId,

        stripeSubscriptionId:
          user.stripeSubscriptionId,

        stripeSubscriptionStatus:
          user.stripeSubscriptionStatus,

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
    accounts[0];

  if (!account) {
    return null;
  }

  return {
    userId:
      account.userId,

    email:
      account.email,

    name:
      account.name ??
      null,

    beaconPlusActive:
      hasBeaconPlusAccess(
        account
      ),

    beaconPlusCurrentPeriodEnd:
      account
        .beaconPlusCurrentPeriodEnd ??
      null,

    stripeCustomerId:
      account
        .stripeCustomerId ??
      null,

    stripeSubscriptionId:
      account
        .stripeSubscriptionId ??
      null,

    stripeSubscriptionStatus:
      account
        .stripeSubscriptionStatus ??
      null,

    purchasedCredits:
      account
        .purchasedCredits ??
      0,
  };
}

export async function getBeaconAccountAccess(): Promise<
  BeaconAccountAccess | null
> {
  const userId =
    await readSessionUserId();

  if (!userId) {
    return null;
  }

  return readAccountAccess(
    userId
  );
}

export async function requireSignedInBeaconUser(
  options: RequireSignedInOptions = {}
): Promise<BeaconAccountAccess> {
  const returnTo =
    options.returnTo ??
    "/dashboard";

  const userId =
    await readSessionUserId();

  if (!userId) {
    redirect(
      createSignInUrl(
        returnTo
      )
    );
  }

  const account =
    await readAccountAccess(
      userId
    );

  if (!account) {
    redirect(
      createSignInUrl(
        returnTo
      )
    );
  }

  return account;
}

export async function requireBeaconPlus(
  options: RequireBeaconPlusOptions = {}
): Promise<BeaconAccountAccess> {
  const returnTo =
    options.returnTo ??
    "/dashboard";

  const upgradePath =
    options.upgradePath ??
    "/pricing";

  const account =
    await requireSignedInBeaconUser({
      returnTo,
    });

  if (
    !account.beaconPlusActive
  ) {
    redirect(
      createUpgradeUrl(
        upgradePath,
        returnTo
      )
    );
  }

  return account;
}

export async function requireAvailableCredits(
  minimumCredits = 1,
  options: RequireSignedInOptions = {}
): Promise<BeaconAccountAccess> {
  if (
    !Number.isSafeInteger(
      minimumCredits
    ) ||
    minimumCredits <= 0
  ) {
    throw new Error(
      "minimumCredits must be a positive integer."
    );
  }

  const returnTo =
    options.returnTo ??
    "/dashboard";

  const account =
    await requireSignedInBeaconUser({
      returnTo,
    });

  if (
    account.beaconPlusActive
  ) {
    return account;
  }

  if (
    account.purchasedCredits <
    minimumCredits
  ) {
    const searchParams =
      new URLSearchParams({
        required:
          "credits",

        minimum:
          minimumCredits.toString(),

        next:
          returnTo,
      });

    redirect(
      `/account/billing?${searchParams.toString()}`
    );
  }

  return account;
}