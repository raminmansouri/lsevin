import { state } from "../../../repository";

export const dynamic = "force-dynamic";
export function GET() {
  return Response.json(state());
}
export async function POST(request: Request) {
  Object.assign(
    state(),
    { converted: false, orders: 0, attempts: 0, failFirst: false },
    await request.json()
  );
  return Response.json(state());
}
