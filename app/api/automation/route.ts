export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const conditionSchema = z.object({
  field:    z.enum(["description", "amount", "counterpartyName", "accountId"]),
  operator: z.enum(["contains", "equals", "startsWith", "greaterThan", "lessThan"]),
  value:    z.string(),
});

const actionSchema = z.object({
  field: z.enum(["categoryId", "projectId", "tags"]),
  value: z.string(),
});

const ruleSchema = z.object({
  name:           z.string().min(1),
  conditions:     z.array(conditionSchema).min(1),
  conditionLogic: z.enum(["AND", "OR"]).default("AND"),
  actions:        z.array(actionSchema).min(1),
  priority:       z.number().int().min(0).max(100).default(0),
  isActive:       z.boolean().default(true),
});

export async function GET(_req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;

    const rules = await prisma.automationRule.findMany({
      where: { organizationId: orgId },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(rules);
  } catch (err) {
    console.error("GET /api/automation:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;

    const body = await req.json();
    const parsed = ruleSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

    const rule = await prisma.automationRule.create({
      data: {
        organizationId: orgId,
        ...parsed.data,
        conditions: parsed.data.conditions,
        actions:    parsed.data.actions,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (err) {
    console.error("POST /api/automation:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
