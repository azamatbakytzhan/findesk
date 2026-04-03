"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, Plus, Settings, User } from "lucide-react";
import Link from "next/link";
import { useQuickAdd } from "@/hooks/use-quick-add";
import { QuickAddSheet } from "@/components/layout/quick-add-sheet";

interface HeaderProps {
  orgName?: string;
}

export function Header({ orgName }: HeaderProps) {
  const { data: session } = useSession();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  useQuickAdd(() => setQuickAddOpen(true));

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Организация:</span>
        <span className="text-sm font-semibold text-gray-900">
          {orgName ?? session?.user?.orgName ?? "Загрузка..."}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Button
          size="sm"
          className="bg-[#1A56DB] hover:bg-[#1A56DB]/90 hidden sm:flex"
          onClick={() => setQuickAddOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Добавить
          <kbd className="ml-2 hidden lg:inline-flex items-center gap-0.5 rounded bg-blue-700 px-1.5 py-0.5 text-[10px] font-mono text-blue-200">
            ⌘K
          </kbd>
        </Button>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-gray-500" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[#1A56DB] text-white text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-none">
                  {session?.user?.name ?? "Пользователь"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {session?.user?.email}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{session?.user?.name}</p>
                <p className="text-xs text-gray-500 font-normal mt-0.5">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Профиль
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Настройки
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <QuickAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </header>
  );
}
