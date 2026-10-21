import { listConversations } from "@/features/assistant/server/conversations.repository";
import { getUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** The signed-in user's saved assistant chats, newest first. Guests get an empty list. */
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return Response.json({ conversations: [] });
    return Response.json({ conversations: await listConversations(userId) });
  } catch (error) {
    console.error("[assistant] could not list chats", error);
    return Response.json({ conversations: [] }, { status: 500 });
  }
}
