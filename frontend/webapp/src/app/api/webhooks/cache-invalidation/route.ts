import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { env } from "@/config/env/server";
import {
  CacheInvalidationRequest,
  CacheInvalidationResponse,
  TagInvalidationResult,
} from "@/types/cache";

export async function POST(req: NextRequest) {
  try {
    // Verify webhook key
    const authHeader = req.headers.get("X-WEBHOOK-KEY");
    if (!authHeader) {
      console.error("Cache invalidation webhook: Missing webhook key");
      return NextResponse.json<CacheInvalidationResponse>(
        { success: false, message: "Unauthorized: Missing webhook key" },
        { status: 401 }
      );
    }

    const webhookKey = env.WEBHOOK_KEY;
    if (!webhookKey || authHeader !== webhookKey) {
      console.error("Cache invalidation webhook: Invalid webhook key");
      return NextResponse.json<CacheInvalidationResponse>(
        { success: false, message: "Unauthorized: Invalid webhook key" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { tags } = body as CacheInvalidationRequest;

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      console.error("Cache invalidation webhook: Invalid or empty tags array");
      return NextResponse.json<CacheInvalidationResponse>(
        { success: false, message: "Bad request: Invalid or empty tags array" },
        { status: 400 }
      );
    }

    // Invalidate each tag
    const invalidatedTags: TagInvalidationResult[] = tags.map((tag) => {
      try {
        console.log(`Invalidating cache tag: ${tag}`);
        revalidateTag(tag);
        return { tag, success: true };
      } catch (error) {
        console.error(`Error invalidating tag ${tag}:`, error);
        return { tag, success: false, error: (error as Error).message };
      }
    });

    const allSuccessful = invalidatedTags.every((result) => result.success);

    // Log success message
    console.log(
      `Cache invalidation completed for ${tags.length} tags. All successful: ${allSuccessful}`
    );

    return NextResponse.json<CacheInvalidationResponse>(
      {
        success: true,
        message: `Cache invalidation ${allSuccessful ? "completed" : "partially completed"}`,
        invalidatedTags,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in cache invalidation webhook:", error);
    return NextResponse.json<CacheInvalidationResponse>(
      {
        success: false,
        message: "Internal server error",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
