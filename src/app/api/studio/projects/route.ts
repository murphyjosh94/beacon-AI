/**
 * Beacon Studio projects API
 *
 * This route reuses the existing production Motion projects API while
 * Beacon Studio is migrated from `/api/motion/*` to `/api/studio/*`.
 *
 * Studio clients should use:
 *
 *   GET  /api/studio/projects
 *   POST /api/studio/projects
 */

import {
  GET as getMotionProjects,
  POST as createMotionProject,
} from "../../motion/projects/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return getMotionProjects();
}

export async function POST(
  request: Request,
): Promise<Response> {
  return createMotionProject(request);
}