import { getConversation } from "@/features/assistant/server/conversations.repository";
import { getUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** One of the signed-in user's saved chats, to open it again. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId();
    if (!userId) return Response.json({ error: "Sign in to see your chats." }, { status: 401 });

    const { id } = await params;
    const conversation = await getConversation(userId, id);
    if (!conversation) return Response.json({ error: "Chat not found." }, { status: 404 });
    return Response.json({ conversationId: conversation.id, messages: conversation.messages });
  } catch (error) {
    console.error("[assistant] could not load chat", error);
    return Response.json({ error: "Could not load the chat." }, { status: 500 });
  }
}
