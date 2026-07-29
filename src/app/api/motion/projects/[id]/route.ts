import { del, get, put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREFIX = "motion/projects/";
const FILE = "project.json";

function projectPath(id: string): string {
  return `${PREFIX}${id}/${FILE}`;
}

function errorResponse(
  message: string,
  status: number,
) {
  return NextResponse.json(
    { error: message },
    { status },
  );
}

function isValidProjectId(id: string): boolean {
  return (
    id.trim().length > 0 &&
    !id.includes("/") &&
    !id.includes("\\")
  );
}

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { id } = await params;

    if (!isValidProjectId(id)) {
      return errorResponse(
        "A valid project id is required.",
        400,
      );
    }

    const result = await get(projectPath(id), {
      access: "private",
    });

    if (!result) {
      return errorResponse(
        "Project not found.",
        404,
      );
    }

    if (
      result.statusCode !== 200 ||
      !result.stream
    ) {
      return errorResponse(
        "The project could not be read.",
        500,
      );
    }

    const rawProject = await new Response(
      result.stream,
    ).text();

    let project: unknown;

    try {
      project = JSON.parse(rawProject);
    } catch {
      return errorResponse(
        "The stored project data is invalid.",
        500,
      );
    }

    return NextResponse.json(project, {
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error(
      "[motion-project:get]",
      error,
    );

    return errorResponse(
      "Unable to load project.",
      500,
    );
  }
}

export async function PUT(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { id } = await params;

    if (!isValidProjectId(id)) {
      return errorResponse(
        "A valid project id is required.",
        400,
      );
    }

    const existingProject = await get(
      projectPath(id),
      {
        access: "private",
      },
    );

    if (!existingProject) {
      return errorResponse(
        "Project not found.",
        404,
      );
    }

    const body = (await request.json()) as Record<
      string,
      unknown
    >;

    const project = {
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };

    const blob = await put(
      projectPath(id),
      JSON.stringify(project, null, 2),
      {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      },
    );

    return NextResponse.json({
      success: true,
      project,
      storage: {
        pathname: blob.pathname,
      },
    });
  } catch (error) {
    console.error(
      "[motion-project:put]",
      error,
    );

    return errorResponse(
      "Unable to save project.",
      500,
    );
  }
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { id } = await params;

    if (!isValidProjectId(id)) {
      return errorResponse(
        "A valid project id is required.",
        400,
      );
    }

    const existingProject = await get(
      projectPath(id),
      {
        access: "private",
      },
    );

    if (!existingProject) {
      return errorResponse(
        "Project not found.",
        404,
      );
    }

    await del(projectPath(id));

    return NextResponse.json({
      success: true,
      id,
    });
  } catch (error) {
    console.error(
      "[motion-project:delete]",
      error,
    );

    return errorResponse(
      "Unable to delete project.",
      500,
    );
  }
}