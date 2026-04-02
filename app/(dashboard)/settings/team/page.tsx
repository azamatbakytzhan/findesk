import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeamClient } from "./team-client";
import { getEffectivePlan, PLAN_LIMITS, type PlanKey } from "@/lib/plan-limits";

export default async function TeamSettingsPage() {
  const session = await auth();
  if (!session) return null;

  const orgId = session.user.organizationId;

  const [users, invites] = await Promise.all([
    prisma.user.findMany({
      where:   { organizationId: orgId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invite.findMany({
      where:   { organizationId: orgId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const effectivePlan = getEffectivePlan(session.user.plan, session.user.trialEndsAt);
  const maxUsers      = PLAN_LIMITS[effectivePlan as PlanKey]?.maxUsers ?? 3;

  return (
    <TeamClient
      initialUsers={users.map((u) => ({
        id:        u.id,
        name:      u.name,
        email:     u.email,
        role:      u.role,
        createdAt: u.createdAt.toISOString(),
      }))}
      initialInvites={invites.map((i) => ({
        id:        i.id,
        email:     i.email,
        role:      i.role,
        expiresAt: i.expiresAt.toISOString(),
        createdAt: i.createdAt.toISOString(),
      }))}
      currentUserId={session.user.id}
      currentRole={session.user.role}
      maxUsers={maxUsers === Infinity ? 9999 : maxUsers}
    />
  );
}
