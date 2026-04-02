"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2, Send } from "lucide-react";

interface Settings {
  telegramChatId:   string | null;
  emailDigest:      boolean;
  telegramPayments: boolean;
}

export function NotificationsClient() {
  const [settings, setSettings] = useState<Settings>({
    telegramChatId:   null,
    emailDigest:      true,
    telegramPayments: false,
  });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [testing,  setTesting]  = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    void fetch("/api/notifications")
      .then((r) => r.json())
      .then((json) => { setSettings(json.settings ?? settings); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/notifications", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleTestDigest = async () => {
    setTesting(true);
    try {
      await fetch("/api/digest", { method: "POST" });
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Уведомления</h1></div>
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Уведомления</h1>
        <p className="text-sm text-gray-500 mt-0.5">Настройте, как и куда отправлять уведомления</p>
      </div>

      {/* Email digest */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Email-дайджест</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Еженедельный дайджест</Label>
              <p className="text-xs text-gray-500 mt-0.5">Отчёт о доходах, расходах и задолженностях — каждый понедельник</p>
            </div>
            <Switch
              checked={settings.emailDigest}
              onCheckedChange={(v) => setSettings((s) => ({ ...s, emailDigest: v }))}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={handleTestDigest}
            disabled={testing || !settings.emailDigest}
          >
            {testing ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Отправляем…</>
            ) : testSent ? (
              <><CheckCircle className="w-3.5 h-3.5 mr-1.5 text-green-500" />Отправлено!</>
            ) : (
              <><Send className="w-3.5 h-3.5 mr-1.5" />Тестовый дайджест</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Telegram */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Telegram</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Chat ID</Label>
            <p className="text-xs text-gray-500 mt-0.5 mb-2">
              Напишите <code className="bg-gray-100 px-1 rounded">/start</code> боту{" "}
              <a
                href="https://t.me/FinDeskBot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1A56DB] hover:underline"
              >
                @FinDeskBot
              </a>{" "}
              и скопируйте Chat ID
            </p>
            <Input
              placeholder="123456789"
              value={settings.telegramChatId ?? ""}
              onChange={(e) => setSettings((s) => ({ ...s, telegramChatId: e.target.value || null }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Согласование платежей</Label>
              <p className="text-xs text-gray-500 mt-0.5">Получать запросы на оплату в Telegram</p>
            </div>
            <Switch
              checked={settings.telegramPayments}
              onCheckedChange={(v) => setSettings((s) => ({ ...s, telegramPayments: v }))}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        className="bg-[#1A56DB] hover:bg-[#1A56DB]/90"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Сохраняем…</>
        ) : saved ? (
          <><CheckCircle className="w-4 h-4 mr-2" />Сохранено!</>
        ) : (
          "Сохранить настройки"
        )}
      </Button>
    </div>
  );
}
