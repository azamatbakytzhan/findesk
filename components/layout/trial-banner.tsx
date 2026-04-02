"use client";

import Link from "next/link";
import { Zap, X } from "lucide-react";
import { useState } from "react";

export function TrialBanner({ daysLeft }: { daysLeft: number }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-6 py-2 bg-gradient-to-r from-[#1A56DB] to-[#1E40AF] text-white text-sm">
      <div className="flex items-center gap-2">
        <Zap className="w-3.5 h-3.5 shrink-0" />
        <span>
          Пробный период Business —{" "}
          <strong>
            {daysLeft === 0 ? "последний день" : `${daysLeft} ${pluralDays(daysLeft)}`}
          </strong>{" "}
          осталось.
        </span>
        <Link
          href="/settings/billing"
          className="underline underline-offset-2 hover:opacity-80 font-medium"
        >
          Выбрать тариф →
        </Link>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-0.5 rounded hover:bg-white/20 transition-colors shrink-0"
        aria-label="Закрыть"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function pluralDays(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return "день";
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "дня";
  return "дней";
}
