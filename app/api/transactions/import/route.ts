import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parse } from "csv-parse/sync";

interface CsvRow {
  date?: string;
  Date?: string;
  Дата?: string;
  description?: string;
  Description?: string;
  Описание?: string;
  amount?: string;
  Amount?: string;
  Сумма?: string;
  type?: string;
  Type?: string;
  Тип?: string;
  [key: string]: string | undefined;
}

function parseRow(row: CsvRow): {
  date: Date;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
} | null {
  const rawDate = row.date ?? row.Date ?? row["Дата"] ?? "";
  const rawDesc = row.description ?? row.Description ?? row["Описание"] ?? "";
  const rawAmount = row.amount ?? row.Amount ?? row["Сумма"] ?? "0";
  const rawType = row.type ?? row.Type ?? row["Тип"] ?? "";

  const parsedDate = new Date(rawDate);
  if (isNaN(parsedDate.getTime())) return null;

  const parsedAmount = parseFloat(rawAmount.replace(/[^0-9.,-]/g, "").replace(",", "."));
  if (isNaN(parsedAmount)) return null;

  const absAmount = Math.abs(parsedAmount);
  let type: "INCOME" | "EXPENSE";

  if (rawType.toLowerCase().includes("доход") || rawType.toLowerCase() === "income") {
    type = "INCOME";
  } else if (rawType.toLowerCase().includes("расход") || rawType.toLowerCase() === "expense") {
    type = "EXPENSE";
  } else {
    // Determine by sign
    type = parsedAmount >= 0 ? "INCOME" : "EXPENSE";
  }

  return {
    date: parsedDate,
    description: rawDesc,
    amount: absAmount,
    type,
  };
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = session.user.organizationId;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const accountId = formData.get("accountId") as string | null;

    if (!file) return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    if (!accountId) return NextResponse.json({ error: "Выберите счёт" }, { status: 400 });

    // Verify account belongs to org
    const account = await prisma.account.findFirst({
      where: { id: accountId, organizationId: orgId },
    });
    if (!account) return NextResponse.json({ error: "Счёт не найден" }, { status: 404 });

    const text = await file.text();

    let records: CsvRow[];
    try {
      records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      }) as CsvRow[];
    } catch {
      return NextResponse.json({ error: "Не удалось разобрать CSV файл" }, { status: 400 });
    }

    const parsed = records.map(parseRow).filter(Boolean) as ReturnType<typeof parseRow>[];

    if (parsed.length === 0) {
      return NextResponse.json({ error: "Нет данных для импорта (проверьте формат файла)" }, { status: 400 });
    }

    // Preview mode: just return parsed rows
    const preview = formData.get("preview");
    if (preview === "true") {
      return NextResponse.json({ preview: parsed.slice(0, 5), total: parsed.length });
    }

    // Create all transactions
    const created = await prisma.$transaction(
      parsed.map((row) =>
        prisma.transaction.create({
          data: {
            organizationId: orgId,
            accountId,
            type: row!.type,
            amount: row!.amount,
            date: row!.date,
            description: row!.description || null,
            currency: account.currency,
            isConfirmed: true,
            isPlanned: false,
            aiSuggested: false,
            tags: [],
          },
        })
      )
    );

    return NextResponse.json({ imported: created.length });
  } catch (error) {
    console.error("POST /api/transactions/import error:", error);
    return NextResponse.json({ error: "Ошибка сервера при импорте" }, { status: 500 });
  }
}
