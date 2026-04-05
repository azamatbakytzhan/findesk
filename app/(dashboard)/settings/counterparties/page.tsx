export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CounterpartiesClient } from "./counterparties-client";

export default async function CounterpartiesSettingsPage() {
  const session = await auth();
  if (!session) return null;

  const counterparties = await prisma.counterparty.findMany({
    where:   { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  });

  return (
    <CounterpartiesClient
      initialCounterparties={counterparties.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
