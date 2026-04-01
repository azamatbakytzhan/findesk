import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const accountSchema = z.object({
  name: z.string().min(1, "Введите название счёта"),
  type: z.enum(["BANK", "CASH", "CARD", "EWALLET"]),
  currency: z.string().default("KZT"),
  balance: z.number().default(0),
  color: z.string().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const accounts = await prisma.account.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("GET /api/accounts error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = accountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Ошибка валидации" },
        { status: 400 }
      );
    }

    const account = await prisma.account.create({
      data: {
        ...parsed.data,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("POST /api/accounts error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
