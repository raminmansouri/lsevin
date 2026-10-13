import { createMcpHandler } from "mcp-handler";

import { localeToHeader } from "@/config/locales";
import {
  SEARCH_SERVICES_DESCRIPTION,
  searchServices,
  searchServicesInputSchema,
} from "@/features/assistant/tools/search-services";
import { SEARCH_HOTELS_DESCRIPTION, searchHotels, searchHotelsInputSchema } from "@/features/assistant/tools/search-hotels";
import type { LocaleTypes } from "@/types/common";

export const maxDuration = 60;

/** Only our own assistant (which knows MCP_INTERNAL_TOKEN) may call these tools. */
function isAuthorized(req: Request): boolean {
  const token = process.env.MCP_INTERNAL_TOKEN;
  if (!token) return false;
  return req.headers.get("authorization") === `Bearer ${token}`;
}

async function handler(req: Request): Promise<Response> {
  if (!isAuthorized(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  // The assistant tells us the user's language and whether to show Toman prices, per request.
  const locale = req.headers.get("x-lsevin-locale") ?? "fa";
  const storedLocale = localeToHeader(locale as LocaleTypes) || "fa-IR";
  // Decided by the assistant route from the real visitor (this request comes from our own server).
  const isIranianVisitor = req.headers.get("x-lsevin-iranian") === "1";

  const mcp = createMcpHandler(
    (server) => {
      server.registerTool(
        "search_services",
        {
          title: "Search services",
          description: SEARCH_SERVICES_DESCRIPTION,
          // SDK types lag behind zod's Standard JSON Schema; runtime works (tools/list returns the schema).
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          inputSchema: searchServicesInputSchema as any,
        },
        async (args: unknown) => {
          try {
            const input = searchServicesInputSchema.parse(args);
            const result = await searchServices(input, { storedLocale, isIranianVisitor });
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
          } catch (error) {
            // Return a readable error instead of throwing, so the model can recover.
            console.error("[mcp] search_services failed", error);
            return {
              isError: true,
              content: [{ type: "text" as const, text: "Search is temporarily unavailable." }],
            };
          }
        }
      );

      server.registerTool(
        "search_hotels",
        {
          title: "Search hotels",
          description: SEARCH_HOTELS_DESCRIPTION,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          inputSchema: searchHotelsInputSchema as any,
        },
        async (args: unknown) => {
          try {
            const input = searchHotelsInputSchema.parse(args);
            const result = await searchHotels(input, { storedLocale, isIranianVisitor });
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
          } catch (error) {
            console.error("[mcp] search_hotels failed", error);
            return {
              isError: true,
              content: [{ type: "text" as const, text: "Hotel search is temporarily unavailable." }],
            };
          }
        }
      );
    },
    { serverInfo: { name: "lsevin-assistant", version: "0.1.0" } }
  );

  return mcp(req);
}

export { handler as GET, handler as POST, handler as DELETE };