import { getLatestConversation } from "@/features/assistant/server/conversations.repository";
import { getUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** The signed-in user's latest assistant chat, so it opens where they left off. Guests get nothing. */
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return Response.json({ conversationId: null, messages: [] });

    const conversation = await getLatestConversation(userId);
    return Response.json({
      conversationId: conversation?.id ?? null,
      messages: conversation?.messages ?? [],
    });
  } catch (error) {
    console.error("[assistant] could not load chat history", error);
    return Response.json({ conversationId: null, messages: [] });
  }
}
