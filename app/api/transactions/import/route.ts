import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectFormat, parseByFormat } from "@/lib/parsers/kaspi-parser";

// Simple keyword → category matching
function guessCategory(description: string, categories: { id: string; name: string; type: string }[]): string | null {
  const lower = description.toLowerCase();
  const KEYWORDS: [string[], string][] = [
    [["зарплата", "оклад", "salary", "payroll"],                  "зарплата"],
    [["аренда", "rent", "office"],                                "аренда"],
    [["реклама", "маркетинг", "advertising", "marketing", "smm"], "реклама"],
    [["продукты", "еда", "кафе", "ресторан", "food"],             "питание"],
    [["транспорт", "такси", "uber", "yandex", "taxi", "travel"],  "транспорт"],
    [["связь", "интернет", "телефон", "telecom", "mobile"],       "связь"],
    [["it", "хостинг", "сервер", "software", "hosting"],          "it"],
    [["налог", "tax", "ндс", "кпн"],                              "налоги"],
  ];

  for (const [keywords, tag] of KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      const cat = categories.find((c) => c.name.toLowerCase().includes(tag));
      if (cat) return cat.id;
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = session.user.organizationId;
    const formData = await req.formData();
    const file      = formData.get("file")      as File | null;
    const accountId = formData.get("accountId") as string | null;

    if (!file)      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    if (!accountId) return NextResponse.json({ error: "Выберите счёт" }, { status: 400 });

    // Verify account belongs to org
    const account = await prisma.account.findFirst({
      where: { id: accountId, organizationId: orgId },
    });
    if (!account) return NextResponse.json({ error: "Счёт не найден" }, { status: 404 });

    const text   = await file.text();
    const format = detectFormat(text);

    let parsed;
    try {
      parsed = parseByFormat(text, format);
    } catch {
      return NextResponse.json({ error: "Не удалось разобрать CSV файл" }, { status: 400 });
    }

    if (parsed.length === 0) {
      return NextResponse.json({ error: "Нет данных для импорта (проверьте формат файла)" }, { status: 400 });
    }

    // Preview mode
    if (formData.get("preview") === "true") {
      return NextResponse.json({ preview: parsed.slice(0, 5), total: parsed.length, format });
    }

    // Load categories for auto-categorization
    const categories = await prisma.category.findMany({
      where:  { organizationId: orgId },
      select: { id: true, name: true, type: true },
    });

    let autoCategorized = 0;

    const created = await prisma.$transaction(
      parsed.map((row) => {
        const categoryId = guessCategory(row.description, categories);
        if (categoryId) autoCategorized++;
        return prisma.transaction.create({
          data: {
            organizationId: orgId,
            accountId,
            type:        row.type,
            amount:      row.amount,
            date:        row.date,
            description: row.description || null,
            categoryId:  categoryId ?? null,
            currency:    account.currency,
            isConfirmed: true,
            isPlanned:   false,
            aiSuggested: false,
            tags:        [],
          },
        });
      })
    );

    return NextResponse.json({ imported: created.length, format, autoCategorized });
  } catch (error) {
    console.error("POST /api/transactions/import error:", error);
    return NextResponse.json({ error: "Ошибка сервера при импорте" }, { status: 500 });
  }
}
