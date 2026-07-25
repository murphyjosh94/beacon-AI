import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGES = 6;
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_DESCRIPTION_LENGTH = 8_000;

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

type QuoteCategory = "labour" | "materials" | "equipment" | "other";

type GeneratedQuoteItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  category: QuoteCategory;
};

type GeneratedQuote = {
  title: string;
  summary: string;
  items: GeneratedQuoteItem[];
  notes: string;
  assumptions: string[];
  warnings: string[];
};

const quoteSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "summary",
    "items",
    "notes",
    "assumptions",
    "warnings",
  ],
  properties: {
    title: {
      type: "string",
      minLength: 1,
      maxLength: 140,
    },
    summary: {
      type: "string",
      minLength: 1,
      maxLength: 1_000,
    },
    items: {
      type: "array",
      minItems: 1,
      maxItems: 30,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "description",
          "quantity",
          "unitPrice",
          "vatRate",
          "category",
        ],
        properties: {
          description: {
            type: "string",
            minLength: 1,
            maxLength: 300,
          },
          quantity: {
            type: "number",
            minimum: 0,
            maximum: 100_000,
          },
          unitPrice: {
            type: "number",
            minimum: 0,
            maximum: 1_000_000,
          },
          vatRate: {
            type: "number",
            enum: [0, 5, 20],
          },
          category: {
            type: "string",
            enum: ["labour", "materials", "equipment", "other"],
          },
        },
      },
    },
    notes: {
      type: "string",
      maxLength: 2_000,
    },
    assumptions: {
      type: "array",
      maxItems: 15,
      items: {
        type: "string",
        minLength: 1,
        maxLength: 300,
      },
    },
    warnings: {
      type: "array",
      maxItems: 15,
      items: {
        type: "string",
        minLength: 1,
        maxLength: 300,
      },
    },
  },
} as const;

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}

function getModel() {
  return (
    process.env.OPENAI_QUOTE_MODEL ||
    process.env.OPENAI_MODEL ||
    "gpt-4.1-mini"
  );
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    {
      error: message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function readDescription(formData: FormData) {
  const value = formData.get("description");

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function readImages(formData: FormData) {
  return formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function validateImages(images: File[]) {
  if (images.length > MAX_IMAGES) {
    return `You can upload up to ${MAX_IMAGES} images.`;
  }

  for (const image of images) {
    if (!allowedImageTypes.has(image.type)) {
      return `${image.name || "An uploaded file"} is not a supported image type.`;
    }

    if (image.size > MAX_IMAGE_SIZE_BYTES) {
      return `${image.name || "An uploaded image"} is larger than 8 MB.`;
    }
  }

  return null;
}

async function fileToDataUrl(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${bytes.toString("base64")}`;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function cleanGeneratedQuote(value: GeneratedQuote): GeneratedQuote {
  return {
    title: value.title.trim(),
    summary: value.summary.trim(),
    items: value.items.map((item) => ({
      description: item.description.trim(),
      quantity: Math.max(0, roundMoney(Number(item.quantity) || 0)),
      unitPrice: Math.max(0, roundMoney(Number(item.unitPrice) || 0)),
      vatRate: [0, 5, 20].includes(Number(item.vatRate))
        ? Number(item.vatRate)
        : 20,
      category: item.category,
    })),
    notes: value.notes.trim(),
    assumptions: value.assumptions
      .map((item) => item.trim())
      .filter(Boolean),
    warnings: value.warnings.map((item) => item.trim()).filter(Boolean),
  };
}

function parseGeneratedQuote(outputText: string): GeneratedQuote {
  const parsed = JSON.parse(outputText) as Partial<GeneratedQuote>;

  if (
    typeof parsed.title !== "string" ||
    typeof parsed.summary !== "string" ||
    typeof parsed.notes !== "string" ||
    !Array.isArray(parsed.items) ||
    parsed.items.length === 0 ||
    !Array.isArray(parsed.assumptions) ||
    !Array.isArray(parsed.warnings)
  ) {
    throw new Error("The AI response did not contain a complete quote.");
  }

  const validItems = parsed.items.every((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const candidate = item as Partial<GeneratedQuoteItem>;

    return (
      typeof candidate.description === "string" &&
      typeof candidate.quantity === "number" &&
      typeof candidate.unitPrice === "number" &&
      typeof candidate.vatRate === "number" &&
      (candidate.category === "labour" ||
        candidate.category === "materials" ||
        candidate.category === "equipment" ||
        candidate.category === "other")
    );
  });

  if (!validItems) {
    throw new Error("The AI response contained invalid quote items.");
  }

  return cleanGeneratedQuote(parsed as GeneratedQuote);
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return errorResponse(
        "This endpoint expects a job description and optional images.",
        415,
      );
    }

    const formData = await request.formData();
    const description = readDescription(formData);
    const images = readImages(formData);

    if (description.length < 20) {
      return errorResponse(
        "Please provide a more detailed description of the work.",
      );
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return errorResponse(
        `The description must be ${MAX_DESCRIPTION_LENGTH.toLocaleString(
          "en-GB",
        )} characters or fewer.`,
      );
    }

    const imageError = validateImages(images);

    if (imageError) {
      return errorResponse(imageError);
    }

    const imageParts = await Promise.all(
      images.map(async (image) => ({
        type: "input_image" as const,
        image_url: await fileToDataUrl(image),
        detail: "high" as const,
      })),
    );

    const client = getOpenAIClient();

    const response = await client.responses.create({
      model: getModel(),
      temperature: 0.2,
      max_output_tokens: 3_500,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: `You are Beacon Business Quote Assistant, a careful UK trade quotation drafting system.

Your job is to create an editable draft quotation from the user's description and any supplied images.

Important rules:
- Use British English and GBP pricing.
- Separate labour, materials, equipment hire and other charges into sensible line items.
- Use realistic but conservative UK market estimates only when exact business pricing is unavailable.
- Never present estimates as guaranteed prices.
- Do not invent dimensions, quantities, access conditions, damage or materials that are not visible or stated.
- Put every uncertain detail in assumptions.
- Put safety concerns, hidden-work risks, measurement needs, structural concerns, specialist inspections and on-site checks in warnings.
- Photos cannot prove hidden conditions.
- Do not diagnose structural, electrical, gas, asbestos or other regulated hazards from an image.
- Recommend a qualified inspection in warnings whenever regulated or potentially dangerous work may be involved.
- Use VAT rate 20 unless the described work clearly qualifies for 0 or 5 percent. The business must still review VAT before sending.
- Make each line item understandable to a customer.
- Do not add a profit margin as a separate line unless explicitly requested.
- Do not include markdown.
- Return only data matching the required JSON schema.`,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Prepare an editable UK quotation draft for the following work.

WORK DESCRIPTION:
${description}

SUPPLIED IMAGES:
${images.length} image${images.length === 1 ? "" : "s"} supplied.

Generate:
1. A short job title.
2. A concise summary.
3. Itemised labour, materials, equipment and other costs.
4. Useful customer-facing notes.
5. Explicit assumptions.
6. Explicit checks or warnings required before the quote is sent.`,
            },
            ...imageParts,
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "beacon_business_quote",
          strict: true,
          schema: quoteSchema,
        },
      },
    });

    if (!response.output_text) {
      return errorResponse(
        "Beacon could not create a quote from the supplied information.",
        502,
      );
    }

    const generatedQuote = parseGeneratedQuote(response.output_text);

    return NextResponse.json(generatedQuote, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("AI quote generation failed:", error);

    if (
      error instanceof Error &&
      error.message === "OPENAI_API_KEY is not configured."
    ) {
      return errorResponse(
        "AI quote generation is not configured on the server.",
        503,
      );
    }

    return errorResponse(
      "Beacon could not generate the quote. Please try again.",
      500,
    );
  }
}