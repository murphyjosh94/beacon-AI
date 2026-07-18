import "server-only";

import {
  and,
  eq,
  gte,
  sql,
} from "drizzle-orm";

import { database } from "@/lib/database/Database";

import {
  creditLedger,
  user,
} from "@/lib/database/schema";

export const CREDIT_USAGE_ERROR_CODES = {
  INVALID_AMOUNT:
    "invalid_credit_amount",

  INVALID_DESCRIPTION:
    "invalid_credit_description",

  USER_NOT_FOUND:
    "credit_user_not_found",

  INSUFFICIENT_CREDITS:
    "insufficient_credits",

  INVALID_ALLOWANCE_CONFIGURATION:
    "invalid_allowance_configuration",
} as const;

export type CreditUsageErrorCode =
  (typeof CREDIT_USAGE_ERROR_CODES)[keyof typeof CREDIT_USAGE_ERROR_CODES];

export type CreditMetadataValue =
  | string
  | number
  | boolean
  | null;

export type CreditMetadata =
  Record<
    string,
    CreditMetadataValue
  >;

export type CreditAllowanceTier =
  | "free"
  | "beacon_plus";

export type CreditUsageSource =
  | "daily_allowance"
  | "purchased_credits"
  | "mixed";

export class CreditUsageError extends Error {
  readonly code:
    CreditUsageErrorCode;

  readonly status:
    number;

  readonly requiredCredits:
    number | null;

  readonly availableCredits:
    number | null;

  readonly dailyAllowanceRemaining:
    number | null;

  readonly purchasedCreditsRemaining:
    number | null;

  constructor(
    input: {
      code:
        CreditUsageErrorCode;

      message:
        string;

      status:
        number;

      requiredCredits?:
        number;

      availableCredits?:
        number;

      dailyAllowanceRemaining?:
        number;

      purchasedCreditsRemaining?:
        number;
    }
  ) {
    super(
      input.message
    );

    this.name =
      "CreditUsageError";

    this.code =
      input.code;

    this.status =
      input.status;

    this.requiredCredits =
      input.requiredCredits ??
      null;

    this.availableCredits =
      input.availableCredits ??
      null;

    this.dailyAllowanceRemaining =
      input.dailyAllowanceRemaining ??
      null;

    this.purchasedCreditsRemaining =
      input.purchasedCreditsRemaining ??
      null;
  }
}

export type UseCreditsInput = {
  userId: string;

  amount?: number;

  description: string;

  searchHistoryId?: string;

  metadata?: CreditMetadata;
};

export type UseCreditsResult = {
  userId: string;

  source:
    CreditUsageSource;

  allowanceTier:
    CreditAllowanceTier;

  amountRequested:
    number;

  dailyAllowanceLimit:
    number;

  dailyAllowanceUsedBefore:
    number;

  dailyAllowanceUsed:
    number;

  dailyAllowanceRemaining:
    number;

  purchasedCreditsUsed:
    number;

  purchasedCreditsRemaining:
    number;

  beaconPlusActive:
    boolean;

  ledgerEntryIds:
    string[];
};

type CreditAccount = {
  id: string;

  beaconPlusActive:
    boolean;

  stripeSubscriptionStatus:
    string | null;

  beaconPlusCurrentPeriodEnd:
    Date | null;

  purchasedCredits:
    number;
};

type CreditTransaction =
  Parameters<
    Parameters<
      typeof database.transaction
    >[0]
  >[0];

const DEFAULT_FREE_DAILY_CREDITS =
  5;

const DEFAULT_BEACON_PLUS_DAILY_CREDITS =
  100;

function validateUserId(
  userId: string
): string {
  const cleanedUserId =
    userId.trim();

  if (!cleanedUserId) {
    throw new CreditUsageError({
      code:
        CREDIT_USAGE_ERROR_CODES.USER_NOT_FOUND,

      message:
        "A Beacon user ID is required to use credits.",

      status:
        400,
    });
  }

  return cleanedUserId;
}

function validateCreditAmount(
  amount: number
): number {
  if (
    !Number.isSafeInteger(
      amount
    ) ||
    amount <= 0
  ) {
    throw new CreditUsageError({
      code:
        CREDIT_USAGE_ERROR_CODES.INVALID_AMOUNT,

      message:
        "The credit amount must be a positive whole number.",

      status:
        400,
    });
  }

  return amount;
}

function validateDescription(
  description: string
): string {
  const cleanedDescription =
    description.trim();

  if (!cleanedDescription) {
    throw new CreditUsageError({
      code:
        CREDIT_USAGE_ERROR_CODES.INVALID_DESCRIPTION,

      message:
        "A description is required when using Beacon credits.",

      status:
        400,
    });
  }

  return cleanedDescription;
}

function validateSearchHistoryId(
  searchHistoryId:
    | string
    | undefined
): string | undefined {
  if (!searchHistoryId) {
    return undefined;
  }

  const cleanedId =
    searchHistoryId.trim();

  return (
    cleanedId ||
    undefined
  );
}

function readPositiveIntegerEnvironmentValue(
  environmentVariableName: string,
  fallback: number
): number {
  const rawValue =
    process.env[
      environmentVariableName
    ]?.trim();

  if (!rawValue) {
    return fallback;
  }

  const parsedValue =
    Number(rawValue);

  if (
    !Number.isSafeInteger(
      parsedValue
    ) ||
    parsedValue < 0
  ) {
    throw new CreditUsageError({
      code:
        CREDIT_USAGE_ERROR_CODES.INVALID_ALLOWANCE_CONFIGURATION,

      message:
        `${environmentVariableName} must be a whole number greater than or equal to zero.`,

      status:
        500,
    });
  }

  return parsedValue;
}

function readFreeDailyCreditLimit(): number {
  return readPositiveIntegerEnvironmentValue(
    "BEACON_FREE_DAILY_CREDITS",
    DEFAULT_FREE_DAILY_CREDITS
  );
}

function readBeaconPlusDailyCreditLimit(): number {
  return readPositiveIntegerEnvironmentValue(
    "BEACON_PLUS_DAILY_CREDITS",
    DEFAULT_BEACON_PLUS_DAILY_CREDITS
  );
}

function isActiveSubscriptionStatus(
  status:
    | string
    | null
): boolean {
  return (
    status === "active" ||
    status === "trialing"
  );
}

function hasCurrentSubscriptionPeriod(
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
  account: CreditAccount
): boolean {
  return (
    account.beaconPlusActive &&
    isActiveSubscriptionStatus(
      account
        .stripeSubscriptionStatus
    ) &&
    hasCurrentSubscriptionPeriod(
      account
        .beaconPlusCurrentPeriodEnd
    )
  );
}

function normalisePurchasedCredits(
  value: number
): number {
  if (
    !Number.isFinite(
      value
    ) ||
    value < 0
  ) {
    return 0;
  }

  return Math.floor(
    value
  );
}

function startOfCurrentUtcDay(): Date {
  const now =
    new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  );
}

async function lockAndReadCreditAccount(
  transaction:
    CreditTransaction,
  userId: string
): Promise<
  CreditAccount | null
> {
  const accounts =
    await transaction
      .select({
        id:
          user.id,

        beaconPlusActive:
          user.beaconPlusActive,

        stripeSubscriptionStatus:
          user.stripeSubscriptionStatus,

        beaconPlusCurrentPeriodEnd:
          user.beaconPlusCurrentPeriodEnd,

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
      .limit(1)
      .for(
        "update"
      );

  return (
    accounts[0] ??
    null
  );
}

async function readDailyAllowanceUsage(
  transaction:
    CreditTransaction,
  userId: string,
  allowanceTier:
    CreditAllowanceTier
): Promise<number> {
  const rows =
    await transaction
      .select({
        creditsUsed:
          sql<number>`
            coalesce(
              sum(
                case
                  when ${creditLedger.metadata} ->> 'allowanceTier' = ${allowanceTier}
                  then coalesce(
                    (
                      ${creditLedger.metadata} ->> 'allowanceCreditsUsed'
                    )::integer,
                    0
                  )
                  else 0
                end
              ),
              0
            )
          `,
      })
      .from(
        creditLedger
      )
      .where(
        and(
          eq(
            creditLedger.userId,
            userId
          ),

          eq(
            creditLedger.type,
            "daily_free"
          ),

          gte(
            creditLedger.createdAt,
            startOfCurrentUtcDay()
          )
        )
      );

  const rawCreditsUsed =
    Number(
      rows[0]?.creditsUsed ??
      0
    );

  if (
    !Number.isFinite(
      rawCreditsUsed
    ) ||
    rawCreditsUsed < 0
  ) {
    return 0;
  }

  return Math.floor(
    rawCreditsUsed
  );
}

async function createDailyAllowanceLedgerEntry(
  transaction:
    CreditTransaction,
  input: {
    userId: string;

    amount: number;

    balanceAfter: number;

    description: string;

    allowanceTier:
      CreditAllowanceTier;

    dailyAllowanceLimit:
      number;

    dailyAllowanceUsedAfter:
      number;

    searchHistoryId?:
      string;

    metadata:
      CreditMetadata;
  }
): Promise<string | null> {
  if (
    input.amount <= 0
  ) {
    return null;
  }

  const rows =
    await transaction
      .insert(
        creditLedger
      )
      .values({
        userId:
          input.userId,

        type:
          "daily_free",

        /*
         * Daily allowance usage does not change the
         * purchased-credit balance, so the ledger delta
         * remains zero.
         */
        amount:
          0,

        balanceAfter:
          input.balanceAfter,

        description:
          input.description,

        searchHistoryId:
          input.searchHistoryId,

        metadata: {
          ...input.metadata,

          source:
            "daily_allowance",

          allowanceTier:
            input.allowanceTier,

          allowanceCreditsUsed:
            input.amount,

          dailyAllowanceLimit:
            input.dailyAllowanceLimit,

          dailyAllowanceUsedAfter:
            input.dailyAllowanceUsedAfter,
        },
      })
      .returning({
        id:
          creditLedger.id,
      });

  return (
    rows[0]?.id ??
    null
  );
}

async function createPurchasedCreditLedgerEntry(
  transaction:
    CreditTransaction,
  input: {
    userId: string;

    amount: number;

    balanceAfter: number;

    description: string;

    searchHistoryId?:
      string;

    metadata:
      CreditMetadata;
  }
): Promise<string | null> {
  if (
    input.amount <= 0
  ) {
    return null;
  }

  const rows =
    await transaction
      .insert(
        creditLedger
      )
      .values({
        userId:
          input.userId,

        type:
          "search",

        amount:
          -input.amount,

        balanceAfter:
          input.balanceAfter,

        description:
          input.description,

        searchHistoryId:
          input.searchHistoryId,

        metadata: {
          ...input.metadata,

          source:
            "purchased_credits",

          purchasedCreditsUsed:
            input.amount,
        },
      })
      .returning({
        id:
          creditLedger.id,
      });

  return (
    rows[0]?.id ??
    null
  );
}

function determineUsageSource(
  dailyAllowanceUsed: number,
  purchasedCreditsUsed: number
): CreditUsageSource {
  if (
    dailyAllowanceUsed > 0 &&
    purchasedCreditsUsed > 0
  ) {
    return "mixed";
  }

  if (
    purchasedCreditsUsed > 0
  ) {
    return "purchased_credits";
  }

  return "daily_allowance";
}

export function isCreditUsageError(
  error: unknown
): error is CreditUsageError {
  return (
    error instanceof
      CreditUsageError
  );
}

/**
 * Charges a credit-controlled Beacon action.
 *
 * Credit order:
 *
 * 1. The user's remaining daily allowance.
 * 2. Purchased credits when the daily allowance is exhausted.
 *
 * Free users and Beacon+ members receive separate daily
 * allowance limits. Beacon+ access is confirmed using the
 * stored Stripe subscription state.
 *
 * The user row is locked for the duration of the transaction.
 * This serialises concurrent charges for the same account and
 * prevents two requests from consuming the same allowance or
 * purchased-credit balance.
 */
export async function useCredits(
  input: UseCreditsInput
): Promise<UseCreditsResult> {
  const userId =
    validateUserId(
      input.userId
    );

  const amount =
    validateCreditAmount(
      input.amount ??
      1
    );

  const description =
    validateDescription(
      input.description
    );

  const searchHistoryId =
    validateSearchHistoryId(
      input.searchHistoryId
    );

  const metadata =
    input.metadata ??
    {};

  return database.transaction(
    async (
      transaction
    ): Promise<UseCreditsResult> => {
      const account =
        await lockAndReadCreditAccount(
          transaction,
          userId
        );

      if (!account) {
        throw new CreditUsageError({
          code:
            CREDIT_USAGE_ERROR_CODES.USER_NOT_FOUND,

          message:
            "The Beacon account could not be found.",

          status:
            404,
        });
      }

      const beaconPlusActive =
        hasBeaconPlusAccess(
          account
        );

      const allowanceTier:
        CreditAllowanceTier =
          beaconPlusActive
            ? "beacon_plus"
            : "free";

      const dailyAllowanceLimit =
        beaconPlusActive
          ? readBeaconPlusDailyCreditLimit()
          : readFreeDailyCreditLimit();

      const dailyAllowanceUsedBefore =
        await readDailyAllowanceUsage(
          transaction,
          userId,
          allowanceTier
        );

      const dailyAllowanceRemainingBefore =
        Math.max(
          dailyAllowanceLimit -
            dailyAllowanceUsedBefore,
          0
        );

      const dailyAllowanceUsed =
        Math.min(
          amount,
          dailyAllowanceRemainingBefore
        );

      const purchasedCreditsRequired =
        amount -
        dailyAllowanceUsed;

      const purchasedCreditsBefore =
        normalisePurchasedCredits(
          account.purchasedCredits
        );

      const totalAvailableCredits =
        dailyAllowanceRemainingBefore +
        purchasedCreditsBefore;

      if (
        totalAvailableCredits <
        amount
      ) {
        throw new CreditUsageError({
          code:
            CREDIT_USAGE_ERROR_CODES.INSUFFICIENT_CREDITS,

          message:
            `This action requires ${amount.toLocaleString(
              "en-GB"
            )} Beacon ${
              amount === 1
                ? "credit"
                : "credits"
            }, but only ${totalAvailableCredits.toLocaleString(
              "en-GB"
            )} ${
              totalAvailableCredits ===
              1
                ? "credit is"
                : "credits are"
            } available today.`,

          status:
            402,

          requiredCredits:
            amount,

          availableCredits:
            totalAvailableCredits,

          dailyAllowanceRemaining:
            dailyAllowanceRemainingBefore,

          purchasedCreditsRemaining:
            purchasedCreditsBefore,
        });
      }

      let purchasedCreditsRemaining =
        purchasedCreditsBefore;

      if (
        purchasedCreditsRequired > 0
      ) {
        const updatedAccounts =
          await transaction
            .update(user)
            .set({
              purchasedCredits:
                sql`
                  ${user.purchasedCredits}
                  -
                  ${purchasedCreditsRequired}
                `,

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
                  purchasedCreditsRequired
                )
              )
            )
            .returning({
              purchasedCredits:
                user.purchasedCredits,
            });

        const updatedAccount =
          updatedAccounts[0];

        if (!updatedAccount) {
          throw new CreditUsageError({
            code:
              CREDIT_USAGE_ERROR_CODES.INSUFFICIENT_CREDITS,

            message:
              "The account no longer has enough purchased credits to complete this action.",

            status:
              402,

            requiredCredits:
              amount,

            availableCredits:
              dailyAllowanceRemainingBefore,

            dailyAllowanceRemaining:
              dailyAllowanceRemainingBefore,

            purchasedCreditsRemaining:
              0,
          });
        }

        purchasedCreditsRemaining =
          normalisePurchasedCredits(
            updatedAccount
              .purchasedCredits
          );
      }

      const dailyAllowanceUsedAfter =
        dailyAllowanceUsedBefore +
        dailyAllowanceUsed;

      const dailyAllowanceRemaining =
        Math.max(
          dailyAllowanceLimit -
            dailyAllowanceUsedAfter,
          0
        );

      const ledgerEntryIds:
        string[] = [];

      const allowanceLedgerEntryId =
        await createDailyAllowanceLedgerEntry(
          transaction,
          {
            userId,

            amount:
              dailyAllowanceUsed,

            balanceAfter:
              purchasedCreditsRemaining,

            description,

            allowanceTier,

            dailyAllowanceLimit,

            dailyAllowanceUsedAfter,

            searchHistoryId,

            metadata,
          }
        );

      if (
        allowanceLedgerEntryId
      ) {
        ledgerEntryIds.push(
          allowanceLedgerEntryId
        );
      }

      const purchasedLedgerEntryId =
        await createPurchasedCreditLedgerEntry(
          transaction,
          {
            userId,

            amount:
              purchasedCreditsRequired,

            balanceAfter:
              purchasedCreditsRemaining,

            description,

            searchHistoryId,

            metadata,
          }
        );

      if (
        purchasedLedgerEntryId
      ) {
        ledgerEntryIds.push(
          purchasedLedgerEntryId
        );
      }

      return {
        userId,

        source:
          determineUsageSource(
            dailyAllowanceUsed,
            purchasedCreditsRequired
          ),

        allowanceTier,

        amountRequested:
          amount,

        dailyAllowanceLimit,

        dailyAllowanceUsedBefore,

        dailyAllowanceUsed,

        dailyAllowanceRemaining,

        purchasedCreditsUsed:
          purchasedCreditsRequired,

        purchasedCreditsRemaining,

        beaconPlusActive,

        ledgerEntryIds,
      };
    }
  );
}