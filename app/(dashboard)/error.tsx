"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center p-6">
      <div className="p-4 rounded-full bg-red-50">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-lg font-semibold">Что-то пошло не так</h2>
      <p className="text-muted-foreground text-sm max-w-md">
        {error.message ?? "Произошла непредвиденная ошибка. Попробуйте обновить страницу."}
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>Попробовать снова</Button>
        <Button variant="outline" asChild>
          <a href="/dashboard">На главную</a>
        </Button>
      </div>
    </div>
  );
}
