import { createMcpHandler } from "mcp-handler";

import { localeToHeader } from "@/config/locales";
import {
  SEARCH_SERVICES_DESCRIPTION,
  searchServices,
  searchServicesInputSchema,
} from "@/features/assistant/tools/search-services";

import {
  SEARCH_PRODUCTS_DESCRIPTION,
  searchProductsForAssistant,
  searchProductsInputSchema,
} from "@/features/assistant/tools/search-products";

import {
  GET_TRANSFER_OPTIONS_DESCRIPTION,
  getTransferOptions,
  getTransferOptionsInputSchema,
} from "@/features/assistant/tools/get-transfer-options";

import {
  GET_SERVICE_DETAILS_DESCRIPTION,
  getServiceDetails,
  getServiceDetailsInputSchema,
} from "@/features/assistant/tools/get-service-details";


import {
  BUILD_JOURNEY_PLAN_DESCRIPTION,
  buildJourneyPlan,
  buildJourneyPlanInputSchema,
} from "@/features/assistant/tools/build-journey-plan";

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

      server.registerTool(
        "search_products",
        {
          title: "Search shop products",
          description: SEARCH_PRODUCTS_DESCRIPTION,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          inputSchema: searchProductsInputSchema as any,
        },
        async (args: unknown) => {
          try {
            const input = searchProductsInputSchema.parse(args);
            const result = await searchProductsForAssistant(input, locale);
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
          } catch (error) {
            console.error("[mcp] search_products failed", error);
            return {
              isError: true,
              content: [{ type: "text" as const, text: "Product search is temporarily unavailable." }],
            };
          }
        }
      );
      server.registerTool(
        "get_service_details",
        {
          title: "Get service details",
          description: GET_SERVICE_DETAILS_DESCRIPTION,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          inputSchema: getServiceDetailsInputSchema as any,
        },
        async (args: unknown) => {
          try {
            const input = getServiceDetailsInputSchema.parse(args);
            const result = await getServiceDetails(input, storedLocale);
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
          } catch (error) {
            console.error("[mcp] get_service_details failed", error);
            return {
              isError: true,
              content: [{ type: "text" as const, text: "Service details are temporarily unavailable." }],
            };
          }
        }
      );


      server.registerTool(
        "get_transfer_options",
        {
          title: "Get transfer options",
          description: GET_TRANSFER_OPTIONS_DESCRIPTION,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          inputSchema: getTransferOptionsInputSchema as any,
        },
        async (args: unknown) => {
          try {
            const input = getTransferOptionsInputSchema.parse(args);
            const result = await getTransferOptions(input, storedLocale);
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
          } catch (error) {
            console.error("[mcp] get_transfer_options failed", error);
            return {
              isError: true,
              content: [{ type: "text" as const, text: "Transfer options are temporarily unavailable." }],
            };
          }
        }
      );


      server.registerTool(
        "build_journey_plan",
        {
          title: "Build journey plan",
          description: BUILD_JOURNEY_PLAN_DESCRIPTION,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          inputSchema: buildJourneyPlanInputSchema as any,
        },
        async (args: unknown) => {
          try {
            const input = buildJourneyPlanInputSchema.parse(args);
            const result = await buildJourneyPlan(input, { storedLocale, locale });
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
          } catch (error) {
            console.error("[mcp] build_journey_plan failed", error);
            return {
              isError: true,
              content: [{ type: "text" as const, text: "The journey plan could not be built right now." }],
            };
          }
        }
      );

      
    },
    { serverInfo: { name: "lsevin-assistant", version: "0.2.0" } }
  );

  return mcp(req);
}

export { handler as GET, handler as POST, handler as DELETE };