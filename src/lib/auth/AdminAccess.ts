import "server-only";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth/Auth";
import { database } from "@/lib/database/Database";
import { user } from "@/lib/database/schema";

export type BeaconAccountRole =
  | "user"
  | "admin"
  | null;

export type BeaconAccessAccount = {
  id: string;
  name: string;
  email: string;
  role: BeaconAccountRole;
  isAdministrator: boolean;
};

export class AuthenticationRequiredError extends Error {
  readonly status = 401;

  constructor(
    message =
      "You must be signed in to continue.",
  ) {
    super(message);
    this.name =
      "AuthenticationRequiredError";
  }
}

export class AdministratorRequiredError extends Error {
  readonly status = 403;

  constructor(
    message =
      "Administrator access is required.",
  ) {
    super(message);
    this.name =
      "AdministratorRequiredError";
  }
}

async function readCurrentAccount(): Promise<BeaconAccessAccount | null> {
  const session =
    await auth.api.getSession({
      headers:
        await headers(),
    });

  if (!session?.user?.id) {
    return null;
  }

  const rows =
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
      })
      .from(user)
      .where(
        eq(
          user.id,
          session.user.id,
        ),
      )
      .limit(1);

  const account =
    rows[0];

  if (!account) {
    return null;
  }

  return {
    id:
      account.id,

    name:
      account.name,

    email:
      account.email,

    role:
      account.role,

    isAdministrator:
      account.role ===
      "admin",
  };
}

export async function getCurrentAccessAccount(): Promise<BeaconAccessAccount | null> {
  return readCurrentAccount();
}

export async function requireSignedInAccount(): Promise<BeaconAccessAccount> {
  const account =
    await readCurrentAccount();

  if (!account) {
    throw new AuthenticationRequiredError();
  }

  return account;
}

export async function requireAdministratorAccount(): Promise<BeaconAccessAccount> {
  const account =
    await requireSignedInAccount();

  if (!account.isAdministrator) {
    throw new AdministratorRequiredError();
  }

  return account;
}

export async function isCurrentAccountAdministrator(): Promise<boolean> {
  const account =
    await readCurrentAccount();

  return Boolean(
    account?.isAdministrator,
  );
}

export function hasUnrestrictedBeaconAccess(
  account:
    | BeaconAccessAccount
    | null
    | undefined,
): boolean {
  return Boolean(
    account?.isAdministrator,
  );
}

export function getAccessErrorStatus(
  error: unknown,
): number | null {
  if (
    error instanceof
    AuthenticationRequiredError
  ) {
    return error.status;
  }

  if (
    error instanceof
    AdministratorRequiredError
  ) {
    return error.status;
  }

  return null;
}