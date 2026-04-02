"use client";

import { useSession } from "next-auth/react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasFeature, getEffectivePlan, type PlanLimits } from "@/lib/plan-limits";
import { useRouter } from "next/navigation";

interface PlanGateProps {
  feature: keyof PlanLimits;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function UpgradePrompt({ feature }: { feature: keyof PlanLimits }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Lock className="w-5 h-5 text-gray-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">Функция недоступна</h3>
      <p className="text-xs text-gray-500 mb-4 max-w-xs">
        {featureDescriptions[feature] ?? "Эта функция доступна на тарифе Business или выше."}
      </p>
      <Button
        size="sm"
        className="bg-[#1A56DB] hover:bg-[#1A56DB]/90 text-xs"
        onClick={() => router.push("/settings/billing")}
      >
        Улучшить тариф
      </Button>
    </div>
  );
}

const featureDescriptions: Partial<Record<keyof PlanLimits, string>> = {
  aiAssistant:      "ИИ-ассистент доступен на тарифе Business и выше.",
  telegramBot:      "Telegram-уведомления доступны на тарифе Business и выше.",
  emailDigest:      "Email-дайджест доступен на тарифе Business и выше.",
  paymentApprovals: "Согласование платежей доступно на тарифе Business и выше.",
  budgetModule:     "Модуль бюджетирования доступен на тарифе Business и выше.",
  apiAccess:        "API-доступ доступен только на тарифе FIRST.",
};

export function PlanGate({ feature, children, fallback }: PlanGateProps) {
  const { data: session } = useSession();

  if (!session) return null;

  const effectivePlan = getEffectivePlan(session.user.plan, session.user.trialEndsAt);
  const allowed = hasFeature(effectivePlan, feature);

  if (!allowed) {
    return <>{fallback ?? <UpgradePrompt feature={feature} />}</>;
  }

  return <>{children}</>;
}
