export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const counterpartySchema = z.object({
  name:  z.string().min(1, "Введите название"),
  type:  z.enum(["CLIENT", "SUPPLIER", "EMPLOYEE", "OTHER"]),
  bin:   z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Некорректный email").optional().or(z.literal("")),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

    const counterparties = await prisma.counterparty.findMany({
      where:   { organizationId: session.user.organizationId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(counterparties);
  } catch (error) {
    console.error("GET /api/counterparties error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

    const body   = await req.json();
    const parsed = counterpartySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Ошибка валидации" },
        { status: 400 }
      );
    }

    const { email, ...rest } = parsed.data;

    const counterparty = await prisma.counterparty.create({
      data: {
        ...rest,
        email: email || null,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(counterparty, { status: 201 });
  } catch (error) {
    console.error("POST /api/counterparties error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
