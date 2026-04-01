"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  TrendingUp,
  BarChart3,
  Scale,
  CalendarDays,
  Target,
  CreditCard,
  FolderOpen,
  Bot,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  {
    label: "Дашборд",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Транзакции",
    href: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    label: "Счета",
    href: "/accounts",
    icon: Wallet,
  },
  {
    label: "Отчёты",
    icon: BarChart3,
    children: [
      { label: "ДДС", href: "/cashflow", icon: TrendingUp },
      { label: "ОПиУ", href: "/pnl", icon: BarChart3 },
      { label: "Баланс", href: "/balance", icon: Scale },
    ],
  },
  {
    label: "Платёжный календарь",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    label: "Бюджеты",
    href: "/budgets",
    icon: Target,
  },
  {
    label: "Обязательства",
    href: "/debts",
    icon: CreditCard,
  },
  {
    label: "Проекты",
    href: "/projects",
    icon: FolderOpen,
  },
  {
    label: "ИИ-ассистент",
    href: "/ai",
    icon: Bot,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [reportsOpen, setReportsOpen] = useState(
    pathname.startsWith("/cashflow") ||
      pathname.startsWith("/pnl") ||
      pathname.startsWith("/balance")
  );

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-[#1A56DB] rounded-lg flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">Findesk</span>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-0.5">
          {navItems.map((item) => {
            if (item.children) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setReportsOpen(!reportsOpen)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform",
                        reportsOpen && "rotate-180"
                      )}
                    />
                  </button>
                  {reportsOpen && (
                    <div className="ml-4 mt-0.5 space-y-0.5">
                      {item.children.map((child) => {
                        const isActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                              isActive
                                ? "bg-blue-50 text-[#1A56DB]"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            )}
                          >
                            <child.icon className="w-4 h-4 flex-shrink-0" />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href!}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-[#1A56DB]"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
                {item.label === "ИИ-ассистент" && (
                  <span className="ml-auto bg-[#1A56DB] text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                    AI
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Settings link */}
      <div className="px-3 py-4 border-t border-gray-100">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-blue-50 text-[#1A56DB]"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          Настройки
        </Link>
      </div>
    </aside>
  );
}
