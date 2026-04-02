"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, Zap, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface BillingData {
  current:     string;
  trialEndsAt: string | null;
  prices:      Record<string, number>;
  history:     { id: string; plan: string; amount: string; description: string; createdAt: string }[];
}

const PLAN_FEATURES: Record<string, string[]> = {
  START: [
    "До 3 пользователей",
    "До 3 счетов",
    "Базовый импорт CSV",
    "Отчёты ДДС и ПиУ",
  ],
  BUSINESS: [
    "До 10 пользователей",
    "До 10 счетов",
    "ИИ-ассистент",
    "Telegram-уведомления",
    "Email-дайджест",
    "Согласование платежей",
    "Модуль бюджетирования",
    "Kaspi / Halyk импорт",
  ],
  FIRST: [
    "Безлимитные пользователи",
    "Безлимитные счета",
    "Всё из Business",
    "API-доступ",
    "Приоритетная поддержка",
    "Персональный менеджер",
  ],
};

const PLAN_ICONS: Record<string, React.ReactNode> = {
  START:    <span className="text-gray-400 text-lg">🌱</span>,
  BUSINESS: <Zap className="w-5 h-5 text-[#1A56DB]" />,
  FIRST:    <Crown className="w-5 h-5 text-amber-500" />,
};

const PLAN_LABELS: Record<string, string> = {
  START:    "Start",
  BUSINESS: "Business",
  FIRST:    "First",
};

export function BillingClient() {
  const [data,    setData]    = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/billing");
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchData(); }, []);

  const handleChangePlan = async (plan: string) => {
    if (!data || plan === data.current) return;
    setSaving(plan);
    try {
      await fetch("/api/billing", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan }),
      });
      await fetchData();
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Тарифы и оплата</h1></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const trialActive = data?.trialEndsAt && new Date(data.trialEndsAt) > new Date();
  const trialDays   = trialActive
    ? Math.ceil((new Date(data!.trialEndsAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Тарифы и оплата</h1>
        <p className="text-sm text-gray-500 mt-0.5">Управление подпиской</p>
      </div>

      {trialActive && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <Zap className="w-4 h-4 shrink-0" />
          <span>
            Пробный период активен — <strong>{trialDays} дней осталось.</strong> Сейчас доступны все функции Business.
          </span>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["START", "BUSINESS", "FIRST"].map((plan) => {
          const isCurrent = data?.current === plan;
          const price = data?.prices[plan] ?? 0;
          return (
            <Card
              key={plan}
              className={cn(
                "border-2 transition-colors",
                isCurrent ? "border-[#1A56DB] shadow-md" : "border-gray-100 hover:border-gray-200"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {PLAN_ICONS[plan]}
                    <CardTitle className="text-base font-semibold">{PLAN_LABELS[plan]}</CardTitle>
                  </div>
                  {isCurrent && <Badge className="bg-[#1A56DB] text-white text-xs">Активен</Badge>}
                </div>
                <p className="text-2xl font-bold mt-2">
                  {price === 0 ? "Бесплатно" : `${formatCurrency(price)}/мес`}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1.5">
                  {(PLAN_FEATURES[plan] ?? []).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-3.5 h-3.5 text-[#0E9F6E] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={cn(
                    "w-full mt-2 text-sm",
                    isCurrent
                      ? "bg-gray-100 text-gray-500 cursor-default hover:bg-gray-100"
                      : "bg-[#1A56DB] hover:bg-[#1A56DB]/90 text-white"
                  )}
                  disabled={isCurrent || saving === plan}
                  onClick={() => handleChangePlan(plan)}
                >
                  {saving === plan ? "Применяем…" : isCurrent ? "Текущий тариф" : `Перейти на ${PLAN_LABELS[plan]}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment history */}
      {data?.history && data.history.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">История платежей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.history.map((h) => (
                <div key={h.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">{h.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(h.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <span className="font-semibold">{formatCurrency(Number(h.amount))}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
