import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  relations,
} from "drizzle-orm";

/*
 * Better Auth core tables
 */

export const userRole =
  pgEnum(
    "user_role",
    [
      "user",
      "admin",
    ]
  );

export const user = pgTable(
  "user",
  {
    id:
      text("id")
        .primaryKey(),

    name:
      text("name")
        .notNull(),

    email:
      text("email")
        .notNull()
        .unique(),

    emailVerified:
      boolean(
        "email_verified"
      )
        .notNull()
        .default(false),

    role:
      userRole(
        "role"
      )
        .notNull()
        .default(
          "user"
        ),

    image:
      text("image"),

    stripeCustomerId:
      text(
        "stripe_customer_id"
      )
        .unique(),

    purchasedCredits:
      integer(
        "purchased_credits"
      )
        .notNull()
        .default(0),

    beaconPlusActive:
      boolean(
        "beacon_plus_active"
      )
        .notNull()
        .default(false),

    stripeSubscriptionId:
      text(
        "stripe_subscription_id"
      )
        .unique(),

    stripeSubscriptionStatus:
      text(
        "stripe_subscription_status"
      ),

    beaconPlusCurrentPeriodEnd:
      timestamp(
        "beacon_plus_current_period_end",
        {
          withTimezone: true,
        }
      ),

    createdAt:
      timestamp(
        "created_at",
        {
          withTimezone: true,
        }
      )
        .notNull()
        .defaultNow(),

    updatedAt:
      timestamp(
        "updated_at",
        {
          withTimezone: true,
        }
      )
        .notNull()
        .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "user_email_unique"
    ).on(
      table.email
    ),

    uniqueIndex(
      "user_stripe_customer_unique"
    ).on(
      table.stripeCustomerId
    ),

    uniqueIndex(
      "user_stripe_subscription_unique"
    ).on(
      table.stripeSubscriptionId
    ),
  ]
);

export const session =
  pgTable(
    "session",
    {
      id:
        text("id")
          .primaryKey(),

      expiresAt:
        timestamp(
          "expires_at",
          {
            withTimezone: true,
          }
        )
          .notNull(),

      token:
        text("token")
          .notNull()
          .unique(),

      createdAt:
        timestamp(
          "created_at",
          {
            withTimezone: true,
          }
        )
          .notNull()
          .defaultNow(),

      updatedAt:
        timestamp(
          "updated_at",
          {
            withTimezone: true,
          }
        )
          .notNull()
          .defaultNow(),

      ipAddress:
        text(
          "ip_address"
        ),

      userAgent:
        text(
          "user_agent"
        ),

      userId:
        text("user_id")
          .notNull()
          .references(
            () => user.id,
            {
              onDelete:
                "cascade",
            }
          ),
    },
    (table) => [
      uniqueIndex(
        "session_token_unique"
      ).on(
        table.token
      ),

      index(
        "session_user_id_idx"
      ).on(
        table.userId
      ),

      index(
        "session_expires_at_idx"
      ).on(
        table.expiresAt
      ),
    ]
  );

export const account =
  pgTable(
    "account",
    {
      id:
        text("id")
          .primaryKey(),

      accountId:
        text(
          "account_id"
        )
          .notNull(),

      providerId:
        text(
          "provider_id"
        )
          .notNull(),

      userId:
        text("user_id")
          .notNull()
          .references(
            () => user.id,
            {
              onDelete:
                "cascade",
            }
          ),

      accessToken:
        text(
          "access_token"
        ),

      refreshToken:
        text(
          "refresh_token"
        ),

      idToken:
        text(
          "id_token"
        ),

      accessTokenExpiresAt:
        timestamp(
          "access_token_expires_at",
          {
            withTimezone: true,
          }
        ),

      refreshTokenExpiresAt:
        timestamp(
          "refresh_token_expires_at",
          {
            withTimezone: true,
          }
        ),

      scope:
        text("scope"),

      password:
        text("password"),

      createdAt:
        timestamp(
          "created_at",
          {
            withTimezone: true,
          }
        )
          .notNull()
          .defaultNow(),

      updatedAt:
        timestamp(
          "updated_at",
          {
            withTimezone: true,
          }
        )
          .notNull()
          .defaultNow(),
    },
    (table) => [
      index(
        "account_user_id_idx"
      ).on(
        table.userId
      ),

      uniqueIndex(
        "account_provider_account_unique"
      ).on(
        table.providerId,
        table.accountId
      ),
    ]
  );

export const verification =
  pgTable(
    "verification",
    {
      id:
        text("id")
          .primaryKey(),

      identifier:
        text(
          "identifier"
        )
          .notNull(),

      value:
        text("value")
          .notNull(),

      expiresAt:
        timestamp(
          "expires_at",
          {
            withTimezone: true,
          }
        )
          .notNull(),

      createdAt:
        timestamp(
          "created_at",
          {
            withTimezone: true,
          }
        )
          .notNull()
          .defaultNow(),

      updatedAt:
        timestamp(
          "updated_at",
          {
            withTimezone: true,
          }
        )
          .notNull()
          .defaultNow(),
    },
    (table) => [
      index(
        "verification_identifier_idx"
      ).on(
        table.identifier
      ),

      index(
        "verification_expires_at_idx"
      ).on(
        table.expiresAt
      ),
    ]
  );

/*
 * Beacon vehicle profiles
 *
 * These provide persistent vehicle context for parts
 * searches. Registration lookup can be added later
 * without changing the core profile architecture.
 */

export const vehicleFuelType =
  pgEnum(
    "vehicle_fuel_type",
    [
      "petrol",
      "diesel",
      "hybrid",
      "plug_in_hybrid",
      "electric",
      "lpg",
      "hydrogen",
      "other",
      "unknown",
    ]
  );

export const vehicleTransmissionType =
  pgEnum(
    "vehicle_transmission_type",
    [
      "manual",
      "automatic",
      "semi_automatic",
      "cvt",
      "single_speed",
      "other",
      "unknown",
    ]
  );

export const userVehicleProfile =
  pgTable(
    "user_vehicle_profile",
    {
      id:
        uuid("id")
          .defaultRandom()
          .primaryKey(),

      userId:
        text("user_id")
          .notNull()
          .references(
            () => user.id,
            {
              onDelete:
                "cascade",
            }
          ),

      /*
       * Optional user-facing label such as:
       * "My Range Rover" or "Family Car".
       */
      nickname:
        text(
          "nickname"
        ),

      make:
        text("make")
          .notNull(),

      model:
        text("model")
          .notNull(),

      /*
       * Platform or generation:
       * L322, G20, Mk7, W205, etc.
       */
      generation:
        text(
          "generation"
        ),

      year:
        integer("year")
          .notNull(),

      /*
       * Human-readable engine specification:
       * 3.6 TDV8, 2.0 TDI, 1.5 EcoBoost, etc.
       */
      engine:
        text("engine")
          .notNull(),

      engineCode:
        text(
          "engine_code"
        ),

      fuelType:
        vehicleFuelType(
          "fuel_type"
        )
          .notNull()
          .default(
            "unknown"
          ),

      transmission:
        vehicleTransmissionType(
          "transmission"
        )
          .notNull()
          .default(
            "unknown"
          ),

      variant:
        text("variant"),

      bodyStyle:
        text(
          "body_style"
        ),

      /*
       * Optional future identifiers.
       *
       * Registration is not required and no registration
       * lookup service is being used at launch.
       */
      registration:
        text(
          "registration"
        ),

      vin:
        text("vin"),

      isDefault:
        boolean(
          "is_default"
        )
          .notNull()
          .default(false),

      isActive:
        boolean(
          "is_active"
        )
          .notNull()
          .default(true),

      /*
       * Useful known maintenance and fitment information.
       * These fields are optional and can be populated later.
       */
      tyreSizeFront:
        text(
          "tyre_size_front"
        ),

      tyreSizeRear:
        text(
          "tyre_size_rear"
        ),

      oilGrade:
        text(
          "oil_grade"
        ),

      batterySpecification:
        text(
          "battery_specification"
        ),

      notes:
        text("notes"),

      /*
       * Extensible data for future provider identifiers,
       * fitment references, service information and
       * registration lookup responses.
       */
      metadata:
        jsonb(
          "metadata"
        )
          .$type<
            Record<
              string,
              string |
                number |
                boolean |
                null
            >
          >()
          .notNull()
          .default({}),

      createdAt:
        timestamp(
          "created_at",
          {
            withTimezone: true,
          }
        )
          .notNull()
          .defaultNow(),

      updatedAt:
        timestamp(
          "updated_at",
          {
            withTimezone: true,
          }
        )
          .notNull()
          .defaultNow(),
    },
    (table) => [
      index(
        "user_vehicle_profile_user_id_idx"
      ).on(
        table.userId
      ),

      index(
        "user_vehicle_profile_default_idx"
      ).on(
        table.userId,
        table.isDefault
      ),

      index(
        "user_vehicle_profile_active_idx"
      ).on(
        table.userId,
        table.isActive
      ),

      index(
        "user_vehicle_profile_vehicle_idx"
      ).on(
        table.make,
        table.model,
        table.year
      ),
    ]
  );

/*
 * Beacon credit ledger
 */

export const creditLedgerType =
  pgEnum(
    "credit_ledger_type",
    [
      "purchase",
      "search",
      "refund",
      "adjustment",
      "promotion",
      "daily_free",
    ]
  );

export const creditLedger =
  pgTable(
    "credit_ledger",
    {
      id:
        uuid("id")
          .defaultRandom()
          .primaryKey(),

      userId:
        text("user_id")
          .notNull()
          .references(
            () => user.id,
            {
              onDelete:
                "cascade",
            }
          ),

      type:
        creditLedgerType(
          "type"
        )
          .notNull(),

      amount:
        integer("amount")
          .notNull(),

      balanceAfter:
        integer(
          "balance_after"
        )
          .notNull(),

      description:
        text(
          "description"
        )
          .notNull(),

      stripeCheckoutSessionId:
        text(
          "stripe_checkout_session_id"
        ),

      stripePaymentIntentId:
        text(
          "stripe_payment_intent_id"
        ),

      searchHistoryId:
        uuid(
          "search_history_id"
        ),

      metadata:
        jsonb(
          "metadata"
        )
          .$type<
            Record<
              string,
              string |
                number |
                boolean |
                null
            >
          >()
          .notNull()
          .default({}),

      createdAt:
        timestamp(
          "created_at",
          {
            withTimezone: true,
          }
        )
          .notNull()
          .defaultNow(),
    },
    (table) => [
      index(
        "credit_ledger_user_id_idx"
      ).on(
        table.userId
      ),

      index(
        "credit_ledger_created_at_idx"
      ).on(
        table.createdAt
      ),

      uniqueIndex(
        "credit_ledger_checkout_session_unique"
      ).on(
        table.stripeCheckoutSessionId
      ),
    ]
  );

/*
 * Search history
 */

export const searchStatus =
  pgEnum(
    "search_status",
    [
      "started",
      "completed",
      "failed",
    ]
  );

export const searchHistory =
  pgTable(
    "search_history",
    {
      id:
        uuid("id")
          .defaultRandom()
          .primaryKey(),

      userId:
        text("user_id")
          .notNull()
          .references(
            () => user.id,
            {
              onDelete:
                "cascade",
            }
          ),

      query:
        text("query")
          .notNull(),

      category:
        text(
          "category"
        ),

      status:
        searchStatus(
          "status"
        )
          .notNull()
          .default(
            "started"
          ),

      responseType:
        text(
          "response_type"
        ),

      resultCount:
        integer(
          "result_count"
        )
          .notNull()
          .default(0),

      creditCharged:
        boolean(
          "credit_charged"
        )
          .notNull()
          .default(false),

      errorCode:
        text(
          "error_code"
        ),

      errorMessage:
        text(
          "error_message"
        ),

      responseData:
        jsonb(
          "response_data"
        )
          .$type<
            unknown
          >(),

      createdAt:
        timestamp(
          "created_at",
          {
            withTimezone: true,
          }
        )
          .notNull()
          .defaultNow(),

      completedAt:
        timestamp(
          "completed_at",
          {
            withTimezone: true,
          }
        ),
    },
    (table) => [
      index(
        "search_history_user_id_idx"
      ).on(
        table.userId
      ),

      index(
        "search_history_created_at_idx"
      ).on(
        table.createdAt
      ),

      index(
        "search_history_status_idx"
      ).on(
        table.status
      ),
    ]
  );

/*
 * Saved searches
 */

export const savedSearch =
  pgTable(
    "saved_search",
    {
      id:
        uuid("id")
          .defaultRandom()
          .primaryKey(),

      userId:
        text("user_id")
          .notNull()
          .references(
            () => user.id,
            {
              onDelete:
                "cascade",
            }
          ),

      name:
        text("name")
          .notNull(),

      query:
        text("query")
          .notNull(),

      category:
        text(
          "category"
        ),

      searchParameters:
        jsonb(
          "search_parameters"
        )
          .$type<
            Record<
              string,
              unknown
            >
          >()
          .notNull()
          .default({}),

      createdAt:
        timestamp(
          "created_at",
          {
            withTimezone: true,
          }
        )
          .notNull()
          .defaultNow(),

      updatedAt:
        timestamp(
          "updated_at",
          {
            withTimezone: true,
          }
        )
          .notNull()
          .defaultNow(),
    },
    (table) => [
      index(
        "saved_search_user_id_idx"
      ).on(
        table.userId
      ),

      index(
        "saved_search_created_at_idx"
      ).on(
        table.createdAt
      ),
    ]
  );

/*
 * Public SEO search pages
 *
 * These records are separate from private user search history.
 * They store completed recommendation responses that can be
 * served at stable, indexable URLs.
 */

export const searchPage =
  pgTable(
    "search_page",
    {
      id:
        uuid("id")
          .defaultRandom()
          .primaryKey(),

      category:
        text("category")
          .notNull(),

      slug:
        text("slug")
          .notNull(),

      path:
        text("path")
          .notNull(),

      query:
        text("query")
          .notNull(),

      title:
        text("title")
          .notNull(),

      description:
        text("description")
          .notNull(),

      responseType:
        text("response_type")
          .notNull(),

      source:
        text("source")
          .notNull(),

      dataProvider:
        text("data_provider")
          .notNull(),

      liveData:
        boolean("live_data")
          .notNull()
          .default(false),

      resultCount:
        integer("result_count")
          .notNull()
          .default(0),

      responseData:
        jsonb("response_data")
          .$type<unknown>()
          .notNull(),

      generatedByUserId:
        text("generated_by_user_id")
          .references(
            () => user.id,
            {
              onDelete:
                "set null",
            }
          ),

      isIndexable:
        boolean("is_indexable")
          .notNull()
          .default(true),

      viewCount:
        integer("view_count")
          .notNull()
          .default(0),

      generatedAt:
        timestamp(
          "generated_at",
          {
            withTimezone: true,
          }
        )
          .notNull()
          .defaultNow(),

      lastViewedAt:
        timestamp(
          "last_viewed_at",
          {
            withTimezone: true,
          }
        ),

      createdAt:
        timestamp(
          "created_at",
          {
            withTimezone: true,
          }
        )
          .notNull()
          .defaultNow(),

      updatedAt:
        timestamp(
          "updated_at",
          {
            withTimezone: true,
          }
        )
          .notNull()
          .defaultNow(),
    },
    (table) => [
      uniqueIndex(
        "search_page_category_slug_unique"
      ).on(
        table.category,
        table.slug
      ),

      uniqueIndex(
        "search_page_path_unique"
      ).on(
        table.path
      ),

      index(
        "search_page_indexable_idx"
      ).on(
        table.isIndexable
      ),

      index(
        "search_page_updated_at_idx"
      ).on(
        table.updatedAt
      ),

      index(
        "search_page_generated_by_user_idx"
      ).on(
        table.generatedByUserId
      ),
    ]
  );

/*
 * Stripe webhook idempotency
 */

export const stripeWebhookStatus =
  pgEnum(
    "stripe_webhook_status",
    [
      "processing",
      "completed",
      "failed",
    ]
  );

export const stripeWebhookEvent =
  pgTable(
    "stripe_webhook_event",
    {
      id:
        uuid("id")
          .defaultRandom()
          .primaryKey(),

      stripeEventId:
        text(
          "stripe_event_id"
        )
          .notNull()
          .unique(),

      eventType:
        text(
          "event_type"
        )
          .notNull(),

      status:
        stripeWebhookStatus(
          "status"
        )
          .notNull()
          .default(
            "processing"
          ),

      userId:
        text(
          "user_id"
        )
          .references(
            () => user.id,
            {
              onDelete:
                "set null",
            }
          ),

      errorMessage:
        text(
          "error_message"
        ),

      payload:
        jsonb(
          "payload"
        )
          .$type<
            unknown
          >(),

      createdAt:
        timestamp(
          "created_at",
          {
            withTimezone: true,
          }
        )
          .notNull()
          .defaultNow(),

      processedAt:
        timestamp(
          "processed_at",
          {
            withTimezone: true,
          }
        ),
    },
    (table) => [
      uniqueIndex(
        "stripe_webhook_event_id_unique"
      ).on(
        table.stripeEventId
      ),

      index(
        "stripe_webhook_event_type_idx"
      ).on(
        table.eventType
      ),

      index(
        "stripe_webhook_status_idx"
      ).on(
        table.status
      ),
    ]
  );

/*
 * Drizzle relations
 */

export const userRelations =
  relations(
    user,
    ({ many }) => ({
      sessions:
        many(
          session
        ),

      accounts:
        many(
          account
        ),

      vehicleProfiles:
        many(
          userVehicleProfile
        ),

      creditLedgerEntries:
        many(
          creditLedger
        ),

      searchHistory:
        many(
          searchHistory
        ),

      savedSearches:
        many(
          savedSearch
        ),

      searchPages:
        many(
          searchPage
        ),

      stripeWebhookEvents:
        many(
          stripeWebhookEvent
        ),
    })
  );

export const sessionRelations =
  relations(
    session,
    ({ one }) => ({
      user:
        one(user, {
          fields: [
            session.userId,
          ],

          references: [
            user.id,
          ],
        }),
    })
  );

export const accountRelations =
  relations(
    account,
    ({ one }) => ({
      user:
        one(user, {
          fields: [
            account.userId,
          ],

          references: [
            user.id,
          ],
        }),
    })
  );

export const userVehicleProfileRelations =
  relations(
    userVehicleProfile,
    ({ one }) => ({
      user:
        one(user, {
          fields: [
            userVehicleProfile
              .userId,
          ],

          references: [
            user.id,
          ],
        }),
    })
  );

export const creditLedgerRelations =
  relations(
    creditLedger,
    ({ one }) => ({
      user:
        one(user, {
          fields: [
            creditLedger.userId,
          ],

          references: [
            user.id,
          ],
        }),
    })
  );

export const searchHistoryRelations =
  relations(
    searchHistory,
    ({ one }) => ({
      user:
        one(user, {
          fields: [
            searchHistory.userId,
          ],

          references: [
            user.id,
          ],
        }),
    })
  );

export const savedSearchRelations =
  relations(
    savedSearch,
    ({ one }) => ({
      user:
        one(user, {
          fields: [
            savedSearch.userId,
          ],

          references: [
            user.id,
          ],
        }),
    })
  );

export const searchPageRelations =
  relations(
    searchPage,
    ({ one }) => ({
      generatedByUser:
        one(user, {
          fields: [
            searchPage.generatedByUserId,
          ],

          references: [
            user.id,
          ],
        }),
    })
  );

export const stripeWebhookEventRelations =
  relations(
    stripeWebhookEvent,
    ({ one }) => ({
      user:
        one(user, {
          fields: [
            stripeWebhookEvent
              .userId,
          ],

          references: [
            user.id,
          ],
        }),
    })
  );

/*
 * Inferred TypeScript types
 */

export type BeaconUser =
  typeof user.$inferSelect;

export type NewBeaconUser =
  typeof user.$inferInsert;

export type BeaconSession =
  typeof session.$inferSelect;

export type UserVehicleProfile =
  typeof userVehicleProfile.$inferSelect;

export type NewUserVehicleProfile =
  typeof userVehicleProfile.$inferInsert;

export type CreditLedgerEntry =
  typeof creditLedger.$inferSelect;

export type SearchHistoryEntry =
  typeof searchHistory.$inferSelect;

export type SavedSearchEntry =
  typeof savedSearch.$inferSelect;

export type SearchPageEntry =
  typeof searchPage.$inferSelect;

export type NewSearchPageEntry =
  typeof searchPage.$inferInsert;

export type StripeWebhookEvent =
  typeof stripeWebhookEvent.$inferSelect;