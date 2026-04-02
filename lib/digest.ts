import { prisma } from "@/lib/prisma";
import { generateDigestHtml, type DigestData } from "@/lib/email-templates/digest";

export async function generateDigest(orgId: string): Promise<DigestData> {
  const now     = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [org, transactions, overdueRec, overduePay, accounts] = await Promise.all([
    prisma.organization.findUnique({
      where:  { id: orgId },
      select: { name: true },
    }),
    prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        isConfirmed:    true,
        isPlanned:      false,
        type:           { in: ["INCOME", "EXPENSE"] },
        date:           { gte: weekAgo, lte: now },
      },
      select: { type: true, amount: true, categoryId: true },
    }),
    prisma.transaction.aggregate({
      where: { organizationId: orgId, isConfirmed: false, isPlanned: true, type: "INCOME",  date: { lt: now } },
      _sum:   { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: { organizationId: orgId, isConfirmed: false, isPlanned: true, type: "EXPENSE", date: { lt: now } },
      _sum:   { amount: true },
      _count: true,
    }),
    prisma.account.findMany({
      where:  { organizationId: orgId, isArchived: false },
      select: { balance: true },
    }),
  ]);

  const categorySpend: Record<string, number> = {};
  let totalIncome = 0, totalExpense = 0;
  for (const tx of transactions) {
    const amt = Number(tx.amount);
    if (tx.type === "INCOME")  totalIncome  += amt;
    if (tx.type === "EXPENSE") {
      totalExpense += amt;
      const key = tx.categoryId ?? "__none__";
      categorySpend[key] = (categorySpend[key] ?? 0) + amt;
    }
  }

  const catIds = Object.keys(categorySpend).filter((k) => k !== "__none__");
  const cats   = catIds.length
    ? await prisma.category.findMany({ where: { id: { in: catIds } }, select: { id: true, name: true } })
    : [];
  const catNames: Record<string, string> = {};
  for (const c of cats) catNames[c.id] = c.name;

  const topExpenses = Object.entries(categorySpend)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, amount]) => ({ name: catNames[id] ?? "Без категории", amount }));

  const cashBalance   = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const overdueCount  = (overdueRec._count ?? 0) + (overduePay._count ?? 0);
  const overdueAmount = Number(overdueRec._sum.amount ?? 0) + Number(overduePay._sum.amount ?? 0);

  const weekStart = weekAgo.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  const weekEnd   = now.toLocaleDateString("ru-RU",     { day: "numeric", month: "long", year: "numeric" });

  return {
    orgName:       org?.name ?? "Ваша компания",
    period:        `${weekStart} — ${weekEnd}`,
    totalIncome,
    totalExpense,
    netCashflow:   totalIncome - totalExpense,
    cashBalance,
    topExpenses,
    overdueCount,
    overdueAmount,
  };
}

export async function sendDigestEmail(orgId: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;

  const settings = await prisma.notificationSettings.findUnique({ where: { organizationId: orgId } });
  if (!settings?.emailDigest) return false;

  const owner = await prisma.user.findFirst({
    where:  { organizationId: orgId, role: "OWNER" },
    select: { email: true },
  });
  if (!owner) return false;

  const data = await generateDigest(orgId);
  const html = generateDigestHtml(data);

  const res = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from:    "Findesk <digest@findesk.app>",
      to:      [owner.email],
      subject: `📊 Финансовый дайджест: ${data.period}`,
      html,
    }),
  });

  return res.ok;
}
