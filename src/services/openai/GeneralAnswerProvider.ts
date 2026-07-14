import "server-only";

import OpenAI from "openai";

import {
  getOpenAIClient,
  getOpenAIModel,
} from "@/services/openai/OpenAIClient";

export type GeneralAnswerResult = {
  answer: string;
  usedWebSearch: boolean;
};

export class GeneralAnswerError extends Error {
  public readonly code:
    | "billing_required"
    | "authentication_failed"
    | "rate_limited"
    | "service_unavailable"
    | "invalid_response"
    | "unknown";

  constructor(
    message: string,
    code: GeneralAnswerError["code"]
  ) {
    super(message);
    this.name = "GeneralAnswerError";
    this.code = code;
  }
}

function mapOpenAIError(error: unknown): GeneralAnswerError {
  if (error instanceof GeneralAnswerError) {
    return error;
  }

  if (error instanceof OpenAI.AuthenticationError) {
    return new GeneralAnswerError(
      "Beacon could not authenticate with its AI service.",
      "authentication_failed"
    );
  }

  if (error instanceof OpenAI.RateLimitError) {
    const message = error.message.toLowerCase();

    if (
      message.includes("quota") ||
      message.includes("billing") ||
      message.includes("credit")
    ) {
      return new GeneralAnswerError(
        "Beacon AI currently needs additional API credit.",
        "billing_required"
      );
    }

    return new GeneralAnswerError(
      "Beacon is receiving too many requests. Please try again shortly.",
      "rate_limited"
    );
  }

  if (
    error instanceof OpenAI.APIConnectionError ||
    error instanceof OpenAI.InternalServerError
  ) {
    return new GeneralAnswerError(
      "Beacon AI is temporarily unavailable. Please try again shortly.",
      "service_unavailable"
    );
  }

  return new GeneralAnswerError(
    "Beacon could not complete this request.",
    "unknown"
  );
}

export async function answerGeneralRequest(
  query: string
): Promise<GeneralAnswerResult> {
  const cleanedQuery = query.trim();

  if (!cleanedQuery) {
    throw new GeneralAnswerError(
      "Please enter a question or request.",
      "invalid_response"
    );
  }

  const client = getOpenAIClient();
  const model = getOpenAIModel();

  try {
    const response = await client.responses.create({
      model,

      instructions: `
You are Beacon AI, a practical UK-focused personal research assistant.

Answer the user's request clearly and directly.

Rules:
- Use British English and GBP where relevant.
- Be honest when information is uncertain.
- Never invent live prices, availability, businesses, booking links or current facts.
- Use web search for current information, recommendations, events, places, news, weather-related planning, changing rules, prices or availability.
- Do not claim that Beacon booked, purchased, reserved or contacted anyone.
- For shopping and hotel requests, explain that Beacon's live recommendation engine should handle them instead.
- Keep answers useful, readable and action-oriented.
- Refuse unsafe or illegal assistance appropriately.
      `.trim(),

      input: cleanedQuery,

      tools: [
        {
          type: "web_search",
        },
      ],
    });

    const answer = response.output_text?.trim();

    if (!answer) {
      throw new GeneralAnswerError(
        "Beacon received an empty response.",
        "invalid_response"
      );
    }

    const usedWebSearch = response.output.some(
      (item) => item.type === "web_search_call"
    );

    return {
      answer,
      usedWebSearch,
    };
  } catch (error) {
    throw mapOpenAIError(error);
  }
}