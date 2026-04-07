"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface Account {
  id: string;
  name: string;
}

interface PreviewRow {
  date: Date;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  onSuccess: () => void;
}

export function CsvImportDialog({ open, onOpenChange, accounts, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const f = acceptedFiles[0];
      if (!f) return;
      setFile(f);
      setPreview(null);

      // Load preview
      setIsPreviewLoading(true);
      try {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("accountId", accountId);
        fd.append("preview", "true");

        const res = await fetch("/api/transactions/import", {
          method: "POST",
          body: fd,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        setPreview(json.preview);
        setTotalRows(json.total);
      } catch (error) {
        toast.error(err instanceof Error ? err.message : "Проверьте формат CSV");
      } finally {
        setIsPreviewLoading(false);
      }
    },
    [accountId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "text/plain": [".txt"] },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!file || !accountId) return;
    setIsImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("accountId", accountId);

      const res = await fetch("/api/transactions/import", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(`Импортировано ${json.imported} транзакций`);
      onOpenChange(false);
      setFile(null);
      setPreview(null);
      onSuccess();
    } catch (error) {
      toast.error(err instanceof Error ? err.message : "Что-то пошло не так");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Импорт транзакций из CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Account selector */}
          <div className="space-y-1.5">
            <Label>Счёт для импорта *</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-[#1A56DB] bg-blue-50"
                : file
                ? "border-green-400 bg-green-50"
                : "border-gray-300 hover:border-gray-400 bg-gray-50"
            )}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 text-green-600" />
                <p className="text-sm font-medium text-green-700">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">
                  {isDragActive ? "Отпустите файл" : "Перетащите CSV файл или нажмите"}
                </p>
                <p className="text-xs text-gray-500">
                  Поддерживаемые форматы: CSV, TXT
                </p>
              </div>
            )}
          </div>

          {/* Format hint */}
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <p className="font-medium mb-1">Ожидаемые колонки CSV:</p>
            <code className="text-gray-700">date, description, amount, type</code>
            <p className="mt-1">
              Тип: <code>income</code> / <code>expense</code> (или отрицательная сумма = расход)
            </p>
          </div>

          {/* Preview */}
          {isPreviewLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500 justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Анализируем файл...
            </div>
          )}

          {preview && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                <CheckCircle className="w-4 h-4" />
                Найдено {totalRows} транзакций. Предпросмотр первых 5:
              </div>
              <div className="border rounded-lg overflow-hidden text-sm">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Дата</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Описание</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                          {formatDate(new Date(row.date))}
                        </td>
                        <td className="px-3 py-2 text-gray-900 max-w-[180px] truncate">
                          {row.description || "—"}
                        </td>
                        <td
                          className={cn(
                            "px-3 py-2 text-right font-medium whitespace-nowrap",
                            row.type === "INCOME" ? "text-green-600" : "text-red-600"
                          )}
                        >
                          {row.type === "INCOME" ? "+" : "−"}
                          {formatCurrency(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Отмена
            </Button>
            <Button
              className="flex-1 bg-[#1A56DB] hover:bg-[#1A56DB]/90"
              disabled={!preview || isImporting}
              onClick={handleImport}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Импортируем...
                </>
              ) : (
                `Импортировать ${totalRows} транзакций`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
