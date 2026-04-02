const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export interface PaymentRequestData {
  id:          string;
  amount:      number;
  currency:    string;
  description: string;
  createdBy:   string;
}

export async function notifyPaymentRequest(
  chatId: string,
  req: PaymentRequestData,
): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;

  const text =
    `💸 *Запрос на оплату*\n\n` +
    `Сумма: *${req.amount.toLocaleString("ru-RU")} ${req.currency}*\n` +
    `Описание: ${req.description}\n` +
    `От: ${req.createdBy}`;

  const body = {
    chat_id:      chatId,
    text,
    parse_mode:   "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Одобрить",  callback_data: `approve:${req.id}` },
          { text: "❌ Отклонить", callback_data: `reject:${req.id}` },
        ],
      ],
    },
  };

  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
}

export async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text: string): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}
