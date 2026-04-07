export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { answerCallbackQuery, sendTelegramMessage } from "@/lib/telegram";

interface TelegramUpdate {
  update_id:      number;
  message?:       { chat: { id: number }; text?: string };
  callback_query?: {
    id:   string;
    data: string;
    from: { id: number };
    message: { chat: { id: number }; message_id: number };
  };
}

export async function POST(req: Request) {
  // Верификация подписи Telegram через секретный токен
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secretToken) {
    const receivedToken = req.headers.get("x-telegram-bot-api-secret-token");
    if (receivedToken !== secretToken) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
    }
  }

  try {
    const update = (await req.json()) as TelegramUpdate;

    // Handle /start command — register chat ID
    if (update.message?.text === "/start") {
      const chatId = String(update.message.chat.id);
      await sendTelegramMessage(
        chatId,
        "👋 Бот Findesk активирован!\n\nВаш Chat ID: `" + chatId + "`\n\nСкопируйте его в настройки уведомлений."
      );
      return NextResponse.json({ ok: true });
    }

    // Handle approve/reject callbacks
    if (update.callback_query) {
      const { id: callbackId, data, from } = update.callback_query;
      const chatId = String(update.callback_query.message.chat.id);

      const [action, requestId] = data.split(":");
      if (!requestId || (action !== "approve" && action !== "reject")) {
        await answerCallbackQuery(callbackId, "Неизвестная команда");
        return NextResponse.json({ ok: true });
      }

      // Find the organization via telegramChatId → notificationSettings
      const notifSettings = await prisma.notificationSettings.findFirst({
        where: { telegramChatId: chatId },
      });
      if (!notifSettings) {
        await answerCallbackQuery(callbackId, "Организация не найдена");
        return NextResponse.json({ ok: true });
      }

      // Find payment request
      const payReq = await prisma.paymentRequest.findFirst({
        where: {
          id:             requestId,
          organizationId: notifSettings.organizationId,
          status:         "PENDING",
        },
      });

      if (!payReq) {
        await answerCallbackQuery(callbackId, "Запрос не найден или уже обработан");
        return NextResponse.json({ ok: true });
      }

      // Find approver by telegramChatId
      const approver = await prisma.user.findFirst({
        where: { organizationId: notifSettings.organizationId, telegramChatId: chatId },
      });

      const newStatus = action === "approve" ? "APPROVED" : "REJECTED";
      await prisma.paymentRequest.update({
        where: { id: requestId },
        data:  { status: newStatus, approvedById: approver?.id ?? null },
      });

      const label = action === "approve" ? "✅ Одобрено" : "❌ Отклонено";
      await answerCallbackQuery(callbackId, label);
      await sendTelegramMessage(chatId, `${label}: запрос на ${Number(payReq.amount).toLocaleString("ru-RU")} ₸`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/telegram/webhook:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
