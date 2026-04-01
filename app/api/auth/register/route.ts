import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  orgName: z.string().min(2, "Название компании должно содержать минимум 2 символа"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Ошибка валидации" },
        { status: 400 }
      );
    }

    const { name, email, password, orgName } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: orgName,
          currency: "KZT",
          timezone: "Asia/Almaty",
        },
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "OWNER",
          organizationId: organization.id,
        },
      });

      // Создаём базовые категории
      const categories = [
        { name: "Выручка от продаж", type: "INCOME" as const, isSystem: true },
        { name: "Прочие доходы", type: "INCOME" as const, isSystem: true },
        { name: "Аренда", type: "EXPENSE" as const, isSystem: true },
        { name: "Зарплата", type: "EXPENSE" as const, isSystem: true },
        { name: "Маркетинг", type: "EXPENSE" as const, isSystem: true },
        { name: "Офисные расходы", type: "EXPENSE" as const, isSystem: true },
        { name: "Налоги", type: "EXPENSE" as const, isSystem: true },
        { name: "Банковские услуги", type: "EXPENSE" as const, isSystem: true },
        { name: "Коммунальные услуги", type: "EXPENSE" as const, isSystem: true },
        { name: "Прочие расходы", type: "EXPENSE" as const, isSystem: true },
      ];

      await tx.category.createMany({
        data: categories.map((c) => ({
          ...c,
          organizationId: organization.id,
        })),
      });

      return { organization, user };
    });

    return NextResponse.json(
      {
        message: "Регистрация успешна",
        userId: result.user.id,
        orgId: result.organization.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Ошибка сервера при регистрации" },
      { status: 500 }
    );
  }
}
