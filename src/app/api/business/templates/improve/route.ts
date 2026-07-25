import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const allowedInstructions: Record<string, string> = {
  professional:
    "Rewrite the document in a more professional, confident and polished business tone.",
  plain:
    "Rewrite the document in clear plain English without losing important meaning.",
  friendly:
    "Rewrite the document in a warmer and friendlier tone while remaining professional.",
  shorter:
    "Make the document more concise. Remove repetition but preserve important facts, protections and actions.",
  expand:
    "Add useful detail and structure where it improves clarity. Do not invent facts or commitments.",
  grammar:
    "Correct grammar, spelling, punctuation and awkward phrasing while preserving the original meaning.",
  uk:
    "Rewrite using natural UK English spelling, terminology and date conventions.",
};

type RequestBody = {
  document?: string;
  instruction?: string;
  templateTitle?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const document = body.document?.trim();
    const instruction = body.instruction
      ? allowedInstructions[body.instruction]
      : undefined;

    if (!document) {
      return NextResponse.json(
        { error: "A document is required." },
        { status: 400 },
      );
    }

    if (!instruction) {
      return NextResponse.json(
        { error: "A valid improvement option is required." },
        { status: 400 },
      );
    }

    if (document.length > 30_000) {
      return NextResponse.json(
        { error: "The document is too long to improve in one request." },
        { status: 413 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Beacon AI is not configured on this environment." },
        { status: 503 },
      );
    }

    const openai = new OpenAI({ apiKey });

    const response = await openai.responses.create({
      model: process.env.OPENAI_DOCUMENT_MODEL || "gpt-5-mini",
      instructions: [
        "You are Beacon AI, a practical UK business writing assistant.",
        "Return only the improved document with no introduction or commentary.",
        "Preserve names, dates, amounts, reference numbers and factual details.",
        "Do not invent legal claims, certifications, guarantees or regulatory compliance.",
        "Do not remove existing warnings or review notices from legal, HR or safety documents.",
        "Use professional UK English.",
      ].join(" "),
      input: `Document type: ${body.templateTitle || "Business document"}

Requested improvement:
${instruction}

Document:
${document}`,
      max_output_tokens: 5000,
    });

    const improved = response.output_text?.trim();

    if (!improved) {
      return NextResponse.json(
        { error: "Beacon AI returned an empty document." },
        { status: 502 },
      );
    }

    return NextResponse.json({ document: improved });
  } catch (error) {
    console.error("Beacon document improvement failed:", error);

    return NextResponse.json(
      { error: "Beacon AI could not improve the document." },
      { status: 500 },
    );
  }
}