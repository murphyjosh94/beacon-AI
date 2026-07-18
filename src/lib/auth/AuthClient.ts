"use client";

import {
  inferAdditionalFields,
} from "better-auth/client/plugins";
import {
  createAuthClient,
} from "better-auth/react";

import type {
  auth,
} from "@/lib/auth/Auth";

export const authClient =
  createAuthClient({
    basePath:
      "/api/auth",

    fetchOptions: {
      credentials:
        "include",
    },

    plugins: [
      inferAdditionalFields<
        typeof auth
      >(),
    ],
  });

export const {
  signIn,
  signOut,
  signUp,
  useSession,
} = authClient;