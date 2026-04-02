"use client";

import { useChat } from "ai/react";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Bot, User, Send, Loader2, Sparkles } from "lucide-react";

const QUICK_PROMPTS = [
  "Сколько заработали в этом месяце?",
  "Топ-5 расходов за последние 30 дней",
  "Есть ли кассовые разрывы в ближайший месяц?",
  "Сравни этот месяц с прошлым",
  "Что происходит с рентабельностью?",
  "Какой у нас текущий баланс?",
];

const TOOL_LABELS: Record<string, string> = {
  getTransactions:    "🔍 Загружаю транзакции…",
  getCashflowReport:  "📊 Считаю отчёт ДДС…",
  comparePeriods:     "📈 Сравниваю периоды…",
  getCashGapForecast: "🔮 Проверяю прогноз…",
  suggestCategory:    "🏷️ Подбираю категорию…",
};

export function AiChatPanel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, input, handleInputChange, handleSubmit, isLoading, append } =
    useChat({ api: "/api/ai/chat" });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleQuickPrompt = (q: string) => {
    void append({ role: "user", content: q });
  };

  return (
    <Card className="h-full border-0 shadow-sm flex flex-col overflow-hidden">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-[#1A56DB]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Финансовый ИИ-ассистент</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              Анализирую данные вашей компании в реальном времени и отвечаю на вопросы о финансах.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {QUICK_PROMPTS.slice(0, 4).map((q) => (
                <button
                  key={q}
                  onClick={() => handleQuickPrompt(q)}
                  className="text-left p-3 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-[#1A56DB] transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 inline mr-1.5 opacity-60" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex gap-3", message.role === "user" ? "flex-row-reverse" : "flex-row")}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                  message.role === "user" ? "bg-[#1A56DB] text-white" : "bg-blue-50"
                )}
              >
                {message.role === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4 text-[#1A56DB]" />
                )}
              </div>

              <div className="max-w-[80%] space-y-1">
                {/* Tool call indicators */}
                {message.toolInvocations?.map((inv, pi) => {
                  if (inv.state !== "call") return null;
                  return (
                    <div
                      key={pi}
                      className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-1.5"
                    >
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {TOOL_LABELS[inv.toolName] ?? "Обрабатываю…"}
                    </div>
                  );
                })}

                {/* Message text */}
                {message.content && (
                  <div
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm",
                      message.role === "user"
                        ? "bg-[#1A56DB] text-white rounded-tr-none"
                        : "bg-gray-100 text-gray-900 rounded-tl-none"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-[#1A56DB]" />
            </div>
            <div className="bg-gray-100 rounded-xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts (shown when messages exist) */}
      {messages.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-50 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              onClick={() => handleQuickPrompt(q)}
              disabled={isLoading}
              className="shrink-0 px-2.5 py-1 rounded-full border border-gray-200 text-xs text-gray-600 hover:border-[#1A56DB] hover:text-[#1A56DB] transition-colors disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-100">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Спросите про ваши финансы…"
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-[#1A56DB] hover:bg-[#1A56DB]/90"
            size="icon"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Ответы основаны на реальных данных вашей компании
        </p>
      </div>
    </Card>
  );
}
