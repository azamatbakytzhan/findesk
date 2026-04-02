"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, ArrowRight, Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Step components ──────────────────────────────────────────────────────────

function WelcomeStep() {
  return (
    <div className="text-center py-4">
      <div className="text-6xl mb-4">🎉</div>
      <p className="text-gray-600 text-base max-w-sm mx-auto">
        Настроим систему за 3 минуты. Вы получите первый финансовый отчёт сразу после настройки.
      </p>
      <ul className="mt-6 space-y-2 text-sm text-gray-500 text-left max-w-xs mx-auto">
        {["Добавите первый счёт", "Загрузите выписку или транзакции", "Получите автоматический отчёт"].map((item, i) => (
          <li key={item} className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#1A56DB] text-white text-xs flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface OrganizationStepProps {
  data: { industry: string; size: string };
  onChange: (d: { industry: string; size: string }) => void;
}

const INDUSTRIES = [
  "Торговля", "Строительство", "Услуги", "Производство",
  "IT / Технологии", "Общественное питание", "Медицина", "Другое",
];
const SIZES = ["1–5 сотрудников", "6–20 сотрудников", "21–100 сотрудников", "100+ сотрудников"];

function OrganizationStep({ data, onChange }: OrganizationStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">Сфера деятельности</Label>
        <Select value={data.industry} onValueChange={(v) => onChange({ ...data, industry: v })}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Выберите отрасль" />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-sm">Количество сотрудников</Label>
        <Select value={data.size} onValueChange={(v) => onChange({ ...data, size: v })}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Выберите размер компании" />
          </SelectTrigger>
          <SelectContent>
            {SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

interface AccountStepProps {
  data: { name: string; type: string; balance: string; currency: string };
  onChange: (d: { name: string; type: string; balance: string; currency: string }) => void;
}

function AccountStep({ data, onChange }: AccountStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">Название счёта</Label>
        <Input
          placeholder="Например: Kaspi Business"
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm">Тип</Label>
          <Select value={data.type} onValueChange={(v) => onChange({ ...data, type: v })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BANK">Банк</SelectItem>
              <SelectItem value="CASH">Касса</SelectItem>
              <SelectItem value="CARD">Карта</SelectItem>
              <SelectItem value="EWALLET">Эл. кошелёк</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Валюта</Label>
          <Select value={data.currency} onValueChange={(v) => onChange({ ...data, currency: v })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="KZT">KZT</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="RUB">RUB</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-sm">Текущий остаток</Label>
        <Input
          type="number"
          placeholder="0"
          value={data.balance}
          onChange={(e) => onChange({ ...data, balance: e.target.value })}
          className="mt-1"
        />
      </div>
    </div>
  );
}

interface ImportStepProps {
  onSkip: () => void;
  imported: number | null;
}

function ImportStep({ onSkip, imported }: ImportStepProps) {
  return (
    <div className="space-y-4">
      {imported !== null ? (
        <div className="flex flex-col items-center py-4 gap-2">
          <CheckCircle className="w-10 h-10 text-green-500" />
          <p className="font-semibold text-gray-800">Импортировано {imported} транзакций!</p>
        </div>
      ) : (
        <>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">Загрузите выписку Kaspi или Halyk</p>
            <p className="text-xs text-gray-400 mt-1">CSV-файл, до 10 МБ</p>
            <p className="text-xs text-gray-400 mt-3">
              Импорт настраивается в <strong>Настройки → Транзакции</strong>
            </p>
          </div>
          <Button variant="outline" className="w-full" onClick={onSkip}>
            Пропустить — добавлю вручную позже
          </Button>
        </>
      )}
    </div>
  );
}

interface DoneStepProps {
  accountName: string;
  importedCount: number;
}

function DoneStep({ accountName, importedCount }: DoneStepProps) {
  return (
    <div className="text-center py-4">
      <div className="text-6xl mb-4">🚀</div>
      <p className="text-gray-600 mb-6">Ваш первый финансовый отчёт уже строится.</p>
      <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>Счёт создан: <strong>{accountName || "Мой счёт"}</strong></span>
        </div>
        {importedCount > 0 && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>Импортировано транзакций: <strong>{importedCount}</strong></span>
          </div>
        )}
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>Пробный период Business — <strong>14 дней</strong></span>
        </div>
      </div>
    </div>
  );
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

interface WizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: WizardProps) {
  const [step,    setStep]    = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const [orgData,     setOrgData]     = useState({ industry: "", size: "" });
  const [accountData, setAccountData] = useState({ name: "", type: "BANK", balance: "0", currency: "KZT" });
  const [imported,    setImported]    = useState<number | null>(null);

  const TOTAL_STEPS = 5;

  const handleNext = async () => {
    if (step === 1) {
      // Save org info (best-effort — ignore errors)
      void fetch("/api/onboarding", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ step: 2 }),
      });
    }

    if (step === 2 && accountData.name) {
      // Create account
      setSaving(true);
      try {
        await fetch("/api/accounts", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            name:     accountData.name,
            type:     accountData.type,
            balance:  parseFloat(accountData.balance) || 0,
            currency: accountData.currency,
          }),
        });
      } finally {
        setSaving(false);
      }
    }

    if (step === TOTAL_STEPS - 1) {
      // Mark complete
      setSaving(true);
      try {
        await fetch("/api/onboarding", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ complete: true }),
        });
        onComplete();
      } finally {
        setSaving(false);
      }
      return;
    }

    setStep((s) => s + 1);
  };

  const handleSkipImport = () => {
    setImported(0);
    setStep((s) => s + 1);
  };

  if (dismissed) return null;

  const steps = [
    { title: "Добро пожаловать в Findesk!",               subtitle: "Настроим систему за 3 минуты" },
    { title: "Расскажите о компании",                      subtitle: "Поможет настроить отчёты" },
    { title: "Добавьте первый счёт",                       subtitle: "Основа для всех отчётов" },
    { title: "Загрузите выписку",                          subtitle: "Можно пропустить" },
    { title: "Всё готово!",                                subtitle: "Перейдите к дашборду" },
  ];

  const current = steps[step];
  const isLast  = step === TOTAL_STEPS - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-[#1A56DB] px-6 pt-6 pb-8 relative">
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            aria-label="Пропустить"
          >
            <X className="w-4 h-4" />
          </button>
          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mb-4">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i < step  ? "bg-white w-6" :
                  i === step ? "bg-white w-8" : "bg-white/30 w-4"
                )}
              />
            ))}
          </div>
          <h2 className="text-white text-xl font-bold">{current.title}</h2>
          <p className="text-blue-200 text-sm mt-0.5">{current.subtitle}</p>
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 0 && <WelcomeStep />}
          {step === 1 && <OrganizationStep data={orgData} onChange={setOrgData} />}
          {step === 2 && <AccountStep data={accountData} onChange={setAccountData} />}
          {step === 3 && (
            <ImportStep
              onSkip={handleSkipImport}
              imported={imported}
            />
          )}
          {step === 4 && (
            <DoneStep
              accountName={accountData.name}
              importedCount={imported ?? 0}
            />
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-400">Шаг {step + 1} из {TOTAL_STEPS}</span>
            <div className="flex gap-2">
              {step > 0 && step < TOTAL_STEPS - 1 && !isLast && (
                <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
                  Назад
                </Button>
              )}
              {/* Skip step 3 if not yet done */}
              {step === 3 && imported === null && (
                <Button variant="ghost" size="sm" onClick={handleSkipImport}>
                  Пропустить
                </Button>
              )}
              <Button
                className="bg-[#1A56DB] hover:bg-[#1A56DB]/90 gap-1.5"
                size="sm"
                onClick={handleNext}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isLast ? (
                  <>К дашборду <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Далее <ArrowRight className="w-4 h-4" /></>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
