"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle, XCircle, Clock, Plus, Loader2, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentRequest {
  id:          string;
  amount:      string;
  currency:    string;
  description: string;
  status:      "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  dueDate:     string | null;
  createdAt:   string;
  createdById: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:  { label: "Ожидает",  color: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "Одобрено", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "Отклонено",color: "bg-red-100 text-red-700" },
  PAID:     { label: "Оплачено", color: "bg-blue-100 text-blue-700" },
};

async function fetchRequests(): Promise<PaymentRequest[]> {
  const res  = await fetch("/api/approvals");
  const json = await res.json();
  return json.requests ?? [];
}

export function ApprovalsClient() {
  const [requests,   setRequests]   = useState<PaymentRequest[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [actionId,   setActionId]   = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form,       setForm]       = useState({ amount: "", description: "", dueDate: "" });
  const [creating,   setCreating]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRequests(await fetchRequests());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleAction = async (id: string, action: "approve" | "reject" | "paid") => {
    const statusMap = { approve: "APPROVED", reject: "REJECTED", paid: "PAID" };
    setActionId(id);
    try {
      await fetch(`/api/approvals/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: statusMap[action] }),
      });
      await load();
    } finally {
      setActionId(null);
    }
  };

  const handleCreate = async () => {
    const amount = parseFloat(form.amount);
    if (!form.description || isNaN(amount) || amount <= 0) return;
    setCreating(true);
    try {
      await fetch("/api/approvals", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          amount,
          description: form.description,
          dueDate:     form.dueDate || null,
        }),
      });
      setCreateOpen(false);
      setForm({ amount: "", description: "", dueDate: "" });
      await load();
    } finally {
      setCreating(false);
    }
  };

  const pending  = requests.filter((r) => r.status === "PENDING");
  const resolved = requests.filter((r) => r.status !== "PENDING");

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Согласование платежей</h1>
          <p className="text-sm text-gray-500 mt-0.5">Запросы на оплату от сотрудников</p>
        </div>
        <Button
          className="bg-[#1A56DB] hover:bg-[#1A56DB]/90"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Новый запрос
        </Button>
      </div>

      {loading ? (
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      ) : requests.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Нет запросов на оплату</p>
            <p className="text-sm text-gray-400 mt-1">Создайте первый запрос кнопкой выше</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pending */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 mb-3">Ожидают решения ({pending.length})</h2>
              <div className="space-y-3">
                {pending.map((req) => (
                  <RequestRow
                    key={req.id}
                    req={req}
                    actionId={actionId}
                    onAction={handleAction}
                    showActions
                  />
                ))}
              </div>
            </div>
          )}

          {/* Resolved */}
          {resolved.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 mb-3">История</h2>
              <div className="space-y-3">
                {resolved.map((req) => (
                  <RequestRow
                    key={req.id}
                    req={req}
                    actionId={actionId}
                    onAction={handleAction}
                    showActions={req.status === "APPROVED"}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый запрос на оплату</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Сумма (KZT)</Label>
              <Input
                type="number"
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-sm">Описание</Label>
              <Textarea
                placeholder="На что платёж?"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-sm">Срок оплаты (необязательно)</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Отмена</Button>
            <Button
              className="bg-[#1A56DB] hover:bg-[#1A56DB]/90"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RequestRow({
  req,
  actionId,
  onAction,
  showActions,
}: {
  req:         PaymentRequest;
  actionId:    string | null;
  onAction:    (id: string, action: "approve" | "reject" | "paid") => void;
  showActions: boolean;
}) {
  const st = STATUS_LABELS[req.status];
  const isActing = actionId === req.id;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="py-3 px-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-gray-800 truncate">{req.description}</p>
              <Badge className={cn("text-xs border-0", st.color)}>{st.label}</Badge>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              <Clock className="w-3 h-3 inline mr-1" />
              {formatDate(new Date(req.createdAt))}
              {req.dueDate && ` · Срок: ${formatDate(new Date(req.dueDate))}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-bold text-sm whitespace-nowrap">
              {formatCurrency(Number(req.amount))}
            </span>
            {showActions && req.status === "PENDING" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => onAction(req.id, "approve")}
                  disabled={isActing}
                >
                  {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 text-red-500 border-red-200 hover:bg-red-50"
                  onClick={() => onAction(req.id, "reject")}
                  disabled={isActing}
                >
                  <XCircle className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
            {showActions && req.status === "APPROVED" && (
              <Button
                size="sm"
                className="h-7 text-xs bg-[#0E9F6E] hover:bg-[#0E9F6E]/90"
                onClick={() => onAction(req.id, "paid")}
                disabled={isActing}
              >
                Оплачено
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
