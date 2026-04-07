export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite) {
      return NextResponse.json({ valid: false, expired: false });
    }

    const expired = invite.expiresAt < new Date() || invite.acceptedAt !== null;
    if (expired) {
      return NextResponse.json({ valid: true, expired: true });
    }

    const org = await prisma.organization.findUnique({
      where:  { id: invite.organizationId },
      select: { name: true },
    });

    return NextResponse.json({
      valid:   true,
      expired: false,
      email:   invite.email,
      orgName: org?.name ?? "Компания",
      role:    invite.role,
    });
  } catch (error) {
    console.error("GET /api/invite/[token]:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { name, password } = (await req.json()) as { name: string; password: string };

    if (!name || !password || password.length < 6) {
      return NextResponse.json({ error: "Имя и пароль (мин. 6 символов) обязательны" }, { status: 400 });
    }

    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite || invite.acceptedAt !== null || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Приглашение недействительно или истекло" }, { status: 400 });
    }

    // Check email not already taken
    const exists = await prisma.user.findUnique({ where: { email: invite.email } });
    if (exists) {
      return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.create({
        data: {
          organizationId: invite.organizationId,
          email:          invite.email,
          name,
          passwordHash,
          role:           invite.role,
        },
      }),
      prisma.invite.update({
        where: { token },
        data:  { acceptedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/invite/[token]:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
