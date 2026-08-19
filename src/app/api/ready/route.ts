import { createReadinessResponse } from "@core/api/health";

export const dynamic = "force-dynamic";

export async function GET() {
  return createReadinessResponse();
}
