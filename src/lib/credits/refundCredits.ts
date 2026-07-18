import "server-only";

import {
  eq,
  sql,
} from "drizzle-orm";

import { database } from "@/lib/database/Database";

import {
  creditLedger,
  user,
} from "@/lib/database/schema";

import type {
  CreditMetadata,
  UseCreditsResult,
} from "@/lib/credits/useCredits";

export const CREDIT_REFUND_ERROR_CODES = {
  INVALID_USER_ID:
    "invalid_refund_user_id",

  INVALID_DESCRIPTION:
    "invalid_refund_description",

  USER_NOT_FOUND:
    "refund_user_not_found",
} as const;

export type CreditRefundErrorCode =
  (typeof CREDIT_REFUND_ERROR_CODES)[keyof typeof CREDIT_REFUND_ERROR_CODES];

export class CreditRefundError extends Error {
  readonly code:
    CreditRefundErrorCode;

  constructor(
    code: CreditRefundErrorCode,
    message: string
  ) {
    super(message);

    this.name =
      "CreditRefundError";

    this.code =
      code;
  }
}

export type RefundCreditsInput = {
  usage:
    UseCreditsResult;

  description: string;

  searchHistoryId?:
    string;

  metadata?:
    CreditMetadata;
};

export type RefundCreditsResult = {
  userId: string;

  dailyAllowanceRefunded:
    number;

  purchasedCreditsRefunded:
    number;

  purchasedCreditsRemaining:
    number;

  ledgerEntryIds:
    string[];
};

type CreditTransaction =
  Parameters<
    Parameters<
      typeof database.transaction
    >[0]
  >[0];

function validateUserId(
  userId: string
): string {
  const cleanedUserId =
    userId.trim();

  if (!cleanedUserId) {
    throw new CreditRefundError(
      CREDIT_REFUND_ERROR_CODES.INVALID_USER_ID,
      "A Beacon user ID is required to refund credits."
    );
  }

  return cleanedUserId;
}

function validateDescription(
  description: string
): string {
  const cleanedDescription =
    description.trim();

  if (!cleanedDescription) {
    throw new CreditRefundError(
      CREDIT_REFUND_ERROR_CODES.INVALID_DESCRIPTION,
      "A description is required when refunding Beacon credits."
    );
  }

  return cleanedDescription;
}

function validateSearchHistoryId(
  searchHistoryId:
    | string
    | undefined
): string | undefined {
  const cleanedId =
    searchHistoryId
      ?.trim();

  return (
    cleanedId ||
    undefined
  );
}

async function lockAndReadPurchasedCredits(
  transaction:
    CreditTransaction,
  userId: string
): Promise<number | null> {
  const rows =
    await transaction
      .select({
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
      .for("update");

  const account =
    rows[0];

  if (!account) {
    return null;
  }

  return Math.max(
    account.purchasedCredits,
    0
  );
}

async function refundPurchasedCredits(
  transaction:
    CreditTransaction,
  input: {
    userId: string;

    amount: number;

    description: string;

    searchHistoryId?:
      string;

    metadata:
      CreditMetadata;
  }
): Promise<{
  balanceAfter: number;
  ledgerEntryId: string | null;
}> {
  if (
    input.amount <= 0
  ) {
    const existingBalance =
      await lockAndReadPurchasedCredits(
        transaction,
        input.userId
      );

    if (
      existingBalance === null
    ) {
      throw new CreditRefundError(
        CREDIT_REFUND_ERROR_CODES.USER_NOT_FOUND,
        "The Beacon account could not be found."
      );
    }

    return {
      balanceAfter:
        existingBalance,

      ledgerEntryId:
        null,
    };
  }

  const updatedAccounts =
    await transaction
      .update(user)
      .set({
        purchasedCredits:
          sql`
            ${user.purchasedCredits}
            +
            ${input.amount}
          `,

        updatedAt:
          new Date(),
      })
      .where(
        eq(
          user.id,
          input.userId
        )
      )
      .returning({
        purchasedCredits:
          user.purchasedCredits,
      });

  const updatedAccount =
    updatedAccounts[0];

  if (!updatedAccount) {
    throw new CreditRefundError(
      CREDIT_REFUND_ERROR_CODES.USER_NOT_FOUND,
      "The Beacon account could not be found."
    );
  }

  const ledgerRows =
    await transaction
      .insert(
        creditLedger
      )
      .values({
        userId:
          input.userId,

        type:
          "refund",

        amount:
          input.amount,

        balanceAfter:
          updatedAccount
            .purchasedCredits,

        description:
          input.description,

        searchHistoryId:
          input.searchHistoryId,

        metadata: {
          ...input.metadata,

          source:
            "purchased_credit_refund",

          purchasedCreditsRefunded:
            input.amount,
        },
      })
      .returning({
        id:
          creditLedger.id,
      });

  return {
    balanceAfter:
      updatedAccount
        .purchasedCredits,

    ledgerEntryId:
      ledgerRows[0]?.id ??
      null,
  };
}

async function refundDailyAllowance(
  transaction:
    CreditTransaction,
  input: {
    userId: string;

    amount: number;

    balanceAfter: number;

    description: string;

    searchHistoryId?:
      string;

    allowanceTier:
      "free"
      | "beacon_plus";

    metadata:
      CreditMetadata;
  }
): Promise<string | null> {
  if (
    input.amount <= 0
  ) {
    return null;
  }

  const ledgerRows =
    await transaction
      .insert(
        creditLedger
      )
      .values({
        userId:
          input.userId,

        type:
          "daily_free",

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
            "daily_allowance_refund",

          allowanceTier:
            input.allowanceTier,

          allowanceCreditsUsed:
            -input.amount,

          dailyAllowanceRefunded:
            input.amount,
        },
      })
      .returning({
        id:
          creditLedger.id,
      });

  return (
    ledgerRows[0]?.id ??
    null
  );
}

export function isCreditRefundError(
  error: unknown
): error is CreditRefundError {
  return (
    error instanceof
      CreditRefundError
  );
}

export async function refundCredits(
  input: RefundCreditsInput
): Promise<RefundCreditsResult> {
  const userId =
    validateUserId(
      input.usage.userId
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
    ): Promise<RefundCreditsResult> => {
      const existingBalance =
        await lockAndReadPurchasedCredits(
          transaction,
          userId
        );

      if (
        existingBalance === null
      ) {
        throw new CreditRefundError(
          CREDIT_REFUND_ERROR_CODES.USER_NOT_FOUND,
          "The Beacon account could not be found."
        );
      }

      const purchasedRefund =
        await refundPurchasedCredits(
          transaction,
          {
            userId,

            amount:
              input.usage
                .purchasedCreditsUsed,

            description,

            searchHistoryId,

            metadata: {
              ...metadata,

              originalUsageSource:
                input.usage.source,
            },
          }
        );

      const allowanceLedgerEntryId =
        await refundDailyAllowance(
          transaction,
          {
            userId,

            amount:
              input.usage
                .dailyAllowanceUsed,

            balanceAfter:
              purchasedRefund
                .balanceAfter,

            description,

            searchHistoryId,

            allowanceTier:
              input.usage
                .allowanceTier,

            metadata: {
              ...metadata,

              originalUsageSource:
                input.usage.source,
            },
          }
        );

      const ledgerEntryIds:
        string[] = [];

      if (
        purchasedRefund
          .ledgerEntryId
      ) {
        ledgerEntryIds.push(
          purchasedRefund
            .ledgerEntryId
        );
      }

      if (
        allowanceLedgerEntryId
      ) {
        ledgerEntryIds.push(
          allowanceLedgerEntryId
        );
      }

      return {
        userId,

        dailyAllowanceRefunded:
          input.usage
            .dailyAllowanceUsed,

        purchasedCreditsRefunded:
          input.usage
            .purchasedCreditsUsed,

        purchasedCreditsRemaining:
          purchasedRefund
            .balanceAfter,

        ledgerEntryIds,
      };
    }
  );
}