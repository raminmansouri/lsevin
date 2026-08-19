import { createLivenessResponse } from "@core/api/health";

export const dynamic = "force-dynamic";

export function GET() {
  return createLivenessResponse();
}
