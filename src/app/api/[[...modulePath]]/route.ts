import { handleModuleApi } from "@core/modules/ApiHost";

type ApiContext = { params: Promise<{ modulePath?: string[] }> };

export async function GET(request: Request, context: ApiContext) {
  const { modulePath } = await context.params;
  return handleModuleApi(request, "GET", modulePath);
}

export async function POST(request: Request, context: ApiContext) {
  const { modulePath } = await context.params;
  return handleModuleApi(request, "POST", modulePath);
}

export async function PUT(request: Request, context: ApiContext) {
  const { modulePath } = await context.params;
  return handleModuleApi(request, "PUT", modulePath);
}

export async function PATCH(request: Request, context: ApiContext) {
  const { modulePath } = await context.params;
  return handleModuleApi(request, "PATCH", modulePath);
}

export async function DELETE(request: Request, context: ApiContext) {
  const { modulePath } = await context.params;
  return handleModuleApi(request, "DELETE", modulePath);
}
