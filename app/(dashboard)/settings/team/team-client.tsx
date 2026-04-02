"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { UserPlus, Trash2, Copy, Clock, Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamUser {
  id:        string;
  name:      string | null;
  email:     string;
  role:      string;
  createdAt: string;
}

interface TeamInvite {
  id:        string;
  email:     string;
  role:      string;
  expiresAt: string;
  createdAt: string;
}

interface Props {
  initialUsers:   TeamUser[];
  initialInvites: TeamInvite[];
  currentUserId:  string;
  currentRole:    string;
  maxUsers:       number;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER:      "Владелец",
  ADMIN:      "Администратор",
  ACCOUNTANT: "Бухгалтер",
  MANAGER:    "Менеджер",
  VIEWER:     "Наблюдатель",
};

const CHANGEABLE_ROLES = ["ADMIN", "ACCOUNTANT", "MANAGER", "VIEWER"];

export function TeamClient({
  initialUsers,
  initialInvites,
  currentUserId,
  currentRole,
  maxUsers,
}: Props) {
  const [users,       setUsers]       = useState<TeamUser[]>(initialUsers);
  const [invites,     setInvites]     = useState<TeamInvite[]>(initialInvites);
  const [inviteOpen,  setInviteOpen]  = useState(false);
  const [deleteOpen,  setDeleteOpen]  = useState<string | null>(null);
  const [inviteForm,  setInviteForm]  = useState({ email: "", role: "VIEWER" });
  const [inviting,    setInviting]    = useState(false);
  const [inviteUrl,   setInviteUrl]   = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState<string | null>(null);
  const [copied,      setCopied]      = useState(false);

  const canManage = currentRole === "OWNER" || currentRole === "ADMIN";
  const totalSlots = users.length + invites.filter((i) => new Date(i.expiresAt) > new Date()).length;

  const handleInvite = async () => {
    if (!inviteForm.email) { setInviteError("Введите email"); return; }
    setInviteError(null);
    setInviting(true);
    try {
      const res  = await fetch("/api/team/invite", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(inviteForm),
      });
      const json = await res.json();
      if (!res.ok) { setInviteError(json.error ?? "Ошибка"); return; }
      setInviteUrl(json.inviteUrl);
      setInvites((prev) => [json.invite, ...prev]);
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (id: string) => {
    await fetch(`/api/team/invite?id=${id}`, { method: "DELETE" });
    setInvites((prev) => prev.filter((i) => i.id !== id));
  };

  const handleChangeRole = async (userId: string, role: string) => {
    setRoleLoading(userId);
    try {
      const res  = await fetch(`/api/team/${userId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ role }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
      }
    } finally {
      setRoleLoading(null);
    }
  };

  const handleDelete = async (userId: string) => {
    await fetch(`/api/team/${userId}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setDeleteOpen(null);
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const usagePct = Math.min(100, Math.round((totalSlots / maxUsers) * 100));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Команда</h1>
          <p className="text-sm text-gray-500 mt-0.5">Управление пользователями и доступами</p>
        </div>
        {canManage && (
          <Button
            className="bg-[#1A56DB] hover:bg-[#1A56DB]/90"
            onClick={() => { setInviteOpen(true); setInviteUrl(null); setInviteError(null); }}
            disabled={totalSlots >= maxUsers}
          >
            <UserPlus className="w-4 h-4 mr-2" /> Пригласить
          </Button>
        )}
      </div>

      {/* Usage bar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-gray-600">Пользователей</span>
            <span className="font-semibold text-gray-800">
              {totalSlots} / {maxUsers === 9999 ? "∞" : maxUsers}
            </span>
          </div>
          {maxUsers !== 9999 && (
            <Progress
              value={usagePct}
              className={cn("h-2", usagePct >= 90 ? "[&>div]:bg-red-500" : "[&>div]:bg-[#1A56DB]")}
            />
          )}
          {totalSlots >= maxUsers && maxUsers !== 9999 && (
            <p className="text-xs text-red-500 mt-1.5">
              Лимит достигнут — обновите тариф в{" "}
              <a href="/settings/billing" className="underline">Тарифах</a>.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Users list */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Пользователи ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {users.map((user) => {
              const initials = user.name
                ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                : user.email.slice(0, 2).toUpperCase();
              const isSelf     = user.id === currentUserId;
              const isOwner    = user.role === "OWNER";
              const canChange  = canManage && !isSelf && !isOwner;

              return (
                <div key={user.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-[#1A56DB] text-white text-sm font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name ?? "Без имени"}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canChange ? (
                      <Select
                        value={user.role}
                        onValueChange={(v) => handleChangeRole(user.id, v)}
                        disabled={roleLoading === user.id}
                      >
                        <SelectTrigger className="h-7 w-36 text-xs">
                          {roleLoading === user.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <SelectValue />
                          }
                        </SelectTrigger>
                        <SelectContent>
                          {CHANGEABLE_ROLES.map((r) => (
                            <SelectItem key={r} value={r} className="text-xs">
                              {ROLE_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {ROLE_LABELS[user.role] ?? user.role}
                      </Badge>
                    )}
                    {canChange && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                        onClick={() => setDeleteOpen(user.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pending invites */}
      {invites.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Ожидают принятия ({invites.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {invites.map((invite) => {
                const expired = new Date(invite.expiresAt) < new Date();
                return (
                  <div key={invite.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{invite.email}</p>
                      <p className={cn("text-xs flex items-center gap-1", expired ? "text-red-400" : "text-gray-400")}>
                        <Clock className="w-3 h-3" />
                        {expired
                          ? "Истёк"
                          : `До ${new Date(invite.expiresAt).toLocaleDateString("ru-RU")}`}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {ROLE_LABELS[invite.role] ?? invite.role}
                    </Badge>
                    {canManage && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                        onClick={() => handleRevokeInvite(invite.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={(o) => { if (!o) { setInviteOpen(false); setInviteUrl(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Пригласить пользователя</DialogTitle>
          </DialogHeader>
          {inviteUrl ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Приглашение создано! Отправьте ссылку пользователю (действует 7 дней):
              </p>
              <div className="flex gap-2">
                <Input value={inviteUrl} readOnly className="text-xs bg-gray-50" />
                <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
                  {copied ? "Скопировано!" : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setInviteOpen(false); setInviteUrl(null); }}
              >
                Закрыть
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Email</Label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Роль</Label>
                  <Select
                    value={inviteForm.role}
                    onValueChange={(v) => setInviteForm((f) => ({ ...f, role: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANGEABLE_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {inviteError && <p className="text-sm text-red-500">{inviteError}</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>Отмена</Button>
                <Button
                  className="bg-[#1A56DB] hover:bg-[#1A56DB]/90"
                  onClick={handleInvite}
                  disabled={inviting}
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Отправить приглашение"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteOpen} onOpenChange={(o) => !o && setDeleteOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
            <AlertDialogDescription>
              Пользователь потеряет доступ к системе. Это действие необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deleteOpen && handleDelete(deleteOpen)}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
