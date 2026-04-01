import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { auth } from "@/lib/auth";
import { buildAiTools } from "@/lib/ai-tools";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    const orgId = session.user.organizationId;

    const tools = buildAiTools(orgId);

    const result = await streamText({
      model: anthropic("claude-sonnet-4-5"),
      system: `Ты — финансовый ассистент компании "${session.user.orgName}".
У тебя есть доступ к финансовым данным компании через инструменты.
Текущая дата: ${new Date().toLocaleDateString("ru-RU")}.
Валюта: KZT (казахстанский тенге).
Всегда отвечай на русском языке.
Будь конкретным: используй реальные цифры из данных.
Форматируй суммы в тенге (например, 1 500 000 ₸).
Отвечай кратко, по делу, используй структурированный текст.`,
      messages,
      tools,
      maxSteps: 5,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("POST /api/ai/chat error:", error);
    return new Response(JSON.stringify({ error: "Ошибка ИИ-сервера" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
