"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface InviteInfo {
  email:   string;
  orgName: string;
  role:    string;
  valid:   boolean;
  expired: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER:      "Владелец",
  ADMIN:      "Администратор",
  ACCOUNTANT: "Бухгалтер",
  MANAGER:    "Менеджер",
  VIEWER:     "Наблюдатель",
};

export function InviteClient({ token }: { token: string }) {
  const router = useRouter();
  const [info,     setInfo]     = useState<InviteInfo | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [form,     setForm]     = useState({ name: "", password: "", confirm: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState(false);

  useEffect(() => {
    void fetch(`/api/invite/${token}`)
      .then((r) => r.json())
      .then((json) => { setInfo(json); setLoading(false); });
  }, [token]);

  const handleAccept = async () => {
    if (!form.name.trim()) { setError("Введите имя"); return; }
    if (form.password.length < 6) { setError("Пароль минимум 6 символов"); return; }
    if (form.password !== form.confirm) { setError("Пароли не совпадают"); return; }
    setError(null);
    setSubmitting(true);
    try {
      const res  = await fetch(`/api/invite/${token}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: form.name, password: form.password }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Ошибка"); return; }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <Loader2 className="w-6 h-6 animate-spin text-[#1A56DB]" />
      </div>
    );
  }

  if (!info?.valid || info.expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {info?.expired ? "Приглашение истекло" : "Ссылка недействительна"}
            </h2>
            <p className="text-sm text-gray-500">
              {info?.expired
                ? "Срок действия приглашения истёк. Попросите администратора отправить новое."
                : "Приглашение не найдено или уже было принято."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Аккаунт создан!</h2>
            <p className="text-sm text-gray-500">Перенаправляем на страницу входа…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 bg-[#1A56DB] rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl font-bold">F</span>
          </div>
          <CardTitle className="text-xl">Приглашение в Findesk</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Вас приглашают в <strong>{info.orgName}</strong> как{" "}
            <span className="text-[#1A56DB] font-medium">
              {ROLE_LABELS[info.role] ?? info.role}
            </span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm">Email</Label>
            <Input value={info.email} disabled className="mt-1 bg-gray-50 text-gray-500" />
          </div>
          <div>
            <Label className="text-sm">Имя</Label>
            <Input
              placeholder="Ваше имя"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Пароль</Label>
            <Input
              type="password"
              placeholder="Минимум 6 символов"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Повторите пароль</Label>
            <Input
              type="password"
              placeholder="Повторите пароль"
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              className="mt-1"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            className="w-full bg-[#1A56DB] hover:bg-[#1A56DB]/90"
            onClick={handleAccept}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Принять приглашение"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
