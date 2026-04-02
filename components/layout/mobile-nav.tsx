"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ArrowUpDown, BarChart3, Calendar, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard",    icon: Home,         label: "Главная" },
  { href: "/transactions", icon: ArrowUpDown,  label: "Операции" },
  { href: "/cashflow",     icon: BarChart3,    label: "Отчёты" },
  { href: "/calendar",     icon: Calendar,     label: "Календарь" },
  { href: "/ai",           icon: Bot,          label: "ИИ" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 md:hidden z-40 safe-area-bottom">
      <div className="flex">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors",
                active ? "text-[#1A56DB]" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
