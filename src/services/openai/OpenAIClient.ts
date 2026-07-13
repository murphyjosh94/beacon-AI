import "server-only";

import OpenAI from "openai";

let client: OpenAI | null = null;

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is missing. Add it to the Beacon AI .env.local file and restart the development server.`
    );
  }

  return value;
}

export function getOpenAIClient(): OpenAI {
  if (client) {
    return client;
  }

  client = new OpenAI({
    apiKey: getRequiredEnvironmentVariable("OPENAI_API_KEY"),
  });

  return client;
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-5.2";
}