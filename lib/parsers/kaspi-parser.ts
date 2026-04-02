import { parse } from "csv-parse/sync";

export type BankFormat = "kaspi" | "halyk" | "universal";

export interface ParsedRow {
  date:        Date;
  description: string;
  amount:      number;
  type:        "INCOME" | "EXPENSE";
}

// ─── Format detection ────────────────────────────────────────────────────────

export function detectFormat(text: string): BankFormat {
  const header = text.split("\n")[0]?.toLowerCase() ?? "";
  if (header.includes("kaspi") || header.includes("каспи")) return "kaspi";
  if (header.includes("halyk") || header.includes("халык")) return "halyk";
  // Kaspi: typical columns — "Дата операции","Описание","Сумма","Баланс"
  if (header.includes("дата операции") || header.includes("date of operation")) return "kaspi";
  // Halyk: typical columns — "Дата","Назначение платежа","Сумма прихода","Сумма расхода"
  if (header.includes("сумма прихода") || header.includes("сумма расхода")) return "halyk";
  return "universal";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tryParseDate(raw: string): Date | null {
  // dd.mm.yyyy or dd/mm/yyyy or yyyy-mm-dd
  const clean = raw.trim();
  const ddmmyyyy = clean.match(/^(\d{2})[./](\d{2})[./](\d{4})/);
  if (ddmmyyyy) {
    const d = new Date(`${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`);
    return isNaN(d.getTime()) ? null : d;
  }
  const iso = new Date(clean);
  return isNaN(iso.getTime()) ? null : iso;
}

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/\s/g, "").replace(",", ".").replace(/[^0-9.-]/g, "")) || 0;
}

function autoDetectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0] ?? "";
  return firstLine.includes(";") ? ";" : ",";
}

// ─── Kaspi parser ─────────────────────────────────────────────────────────────
// Expected columns: "Дата операции", "Описание", "Сумма", "Баланс"
// Negative amount = expense, positive = income

export function parseKaspi(text: string): ParsedRow[] {
  const delimiter = autoDetectDelimiter(text);
  const records = parse(text, {
    columns:           true,
    skip_empty_lines:  true,
    trim:              true,
    bom:               true,
    delimiter,
    relax_column_count: true,
  }) as Record<string, string>[];

  const rows: ParsedRow[] = [];
  for (const row of records) {
    const rawDate   = row["Дата операции"] ?? row["Date of operation"] ?? row["date"] ?? "";
    const rawDesc   = row["Описание"] ?? row["Description"] ?? row["description"] ?? "";
    const rawAmount = row["Сумма"] ?? row["Amount"] ?? row["amount"] ?? "0";

    const date = tryParseDate(rawDate);
    if (!date) continue;

    const amount = parseAmount(rawAmount);
    if (amount === 0) continue;

    rows.push({
      date,
      description: rawDesc,
      amount:      Math.abs(amount),
      type:        amount < 0 ? "EXPENSE" : "INCOME",
    });
  }
  return rows;
}

// ─── Halyk parser ─────────────────────────────────────────────────────────────
// Expected columns: "Дата", "Назначение платежа", "Сумма прихода", "Сумма расхода"

export function parseHalyk(text: string): ParsedRow[] {
  const delimiter = autoDetectDelimiter(text);
  const records = parse(text, {
    columns:           true,
    skip_empty_lines:  true,
    trim:              true,
    bom:               true,
    delimiter,
    relax_column_count: true,
  }) as Record<string, string>[];

  const rows: ParsedRow[] = [];
  for (const row of records) {
    const rawDate    = row["Дата"] ?? row["Date"] ?? row["date"] ?? "";
    const rawDesc    = row["Назначение платежа"] ?? row["Description"] ?? row["description"] ?? "";
    const rawIncome  = row["Сумма прихода"] ?? row["Income"] ?? "0";
    const rawExpense = row["Сумма расхода"] ?? row["Expense"] ?? "0";

    const date = tryParseDate(rawDate);
    if (!date) continue;

    const income  = parseAmount(rawIncome);
    const expense = parseAmount(rawExpense);
    if (income === 0 && expense === 0) continue;

    if (income > 0) {
      rows.push({ date, description: rawDesc, amount: income,  type: "INCOME" });
    }
    if (expense > 0) {
      rows.push({ date, description: rawDesc, amount: expense, type: "EXPENSE" });
    }
  }
  return rows;
}

// ─── Universal parser ─────────────────────────────────────────────────────────

export function parseUniversal(text: string): ParsedRow[] {
  const delimiter = autoDetectDelimiter(text);
  const records = parse(text, {
    columns:           true,
    skip_empty_lines:  true,
    trim:              true,
    bom:               true,
    delimiter,
    relax_column_count: true,
  }) as Record<string, string>[];

  const rows: ParsedRow[] = [];
  for (const row of records) {
    const rawDate   = row.date ?? row.Date ?? row["Дата"] ?? row["дата"] ?? "";
    const rawDesc   = row.description ?? row.Description ?? row["Описание"] ?? row["описание"] ?? "";
    const rawAmount = row.amount ?? row.Amount ?? row["Сумма"] ?? row["сумма"] ?? "0";
    const rawType   = row.type ?? row.Type ?? row["Тип"] ?? row["тип"] ?? "";

    const date = tryParseDate(rawDate);
    if (!date) continue;

    const amount = parseAmount(rawAmount);
    if (isNaN(amount)) continue;
    const absAmount = Math.abs(amount);

    let type: "INCOME" | "EXPENSE";
    const lType = rawType.toLowerCase();
    if (lType.includes("доход") || lType === "income") type = "INCOME";
    else if (lType.includes("расход") || lType === "expense") type = "EXPENSE";
    else type = amount >= 0 ? "INCOME" : "EXPENSE";

    rows.push({ date, description: rawDesc, amount: absAmount, type });
  }
  return rows;
}

// ─── Auto-dispatch ─────────────────────────────────────────────────────────────

export function parseByFormat(text: string, format: BankFormat): ParsedRow[] {
  if (format === "kaspi")   return parseKaspi(text);
  if (format === "halyk")   return parseHalyk(text);
  return parseUniversal(text);
}
