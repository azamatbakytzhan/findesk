import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function randomAmount(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

async function main() {
  console.log("🌱 Запуск сидирования...");

  // Clean up
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.category.deleteMany();
  await prisma.account.deleteMany();
  await prisma.counterparty.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Create organization
  const org = await prisma.organization.create({
    data: {
      name: 'ТОО "Ромашка и Партнёры"',
      bin: "210540001234",
      currency: "KZT",
      timezone: "Asia/Almaty",
      plan: "BUSINESS",
    },
  });

  console.log("✅ Организация создана:", org.name);

  // Create users
  const passwordHash = await bcrypt.hash("password123", 12);

  const owner = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: "owner@romashka.kz",
      name: "Асель Нурланова",
      passwordHash,
      role: "OWNER",
    },
  });

  const accountant = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: "accountant@romashka.kz",
      name: "Серик Байжанов",
      passwordHash,
      role: "ACCOUNTANT",
    },
  });

  console.log("✅ Пользователи созданы:", owner.email, accountant.email);

  // Create accounts
  const mainAccount = await prisma.account.create({
    data: {
      organizationId: org.id,
      name: "Основной счёт (Kaspi)",
      type: "BANK",
      currency: "KZT",
      balance: 4500000,
      color: "#1A56DB",
    },
  });

  const cashAccount = await prisma.account.create({
    data: {
      organizationId: org.id,
      name: "Касса",
      type: "CASH",
      currency: "KZT",
      balance: 280000,
      color: "#0E9F6E",
    },
  });

  const cardAccount = await prisma.account.create({
    data: {
      organizationId: org.id,
      name: "Корпоративная карта",
      type: "CARD",
      currency: "KZT",
      balance: 150000,
      color: "#FF8C00",
    },
  });

  console.log("✅ Счета созданы: 3 счёта");

  // Create categories
  const incomeCategories = await Promise.all([
    prisma.category.create({
      data: { organizationId: org.id, name: "Выручка от продаж", type: "INCOME", isSystem: true },
    }),
    prisma.category.create({
      data: { organizationId: org.id, name: "Консультационные услуги", type: "INCOME" },
    }),
    prisma.category.create({
      data: { organizationId: org.id, name: "Прочие доходы", type: "INCOME", isSystem: true },
    }),
  ]);

  const expenseCategories = await Promise.all([
    prisma.category.create({
      data: { organizationId: org.id, name: "Зарплата", type: "EXPENSE", isSystem: true },
    }),
    prisma.category.create({
      data: { organizationId: org.id, name: "Аренда офиса", type: "EXPENSE", isSystem: true },
    }),
    prisma.category.create({
      data: { organizationId: org.id, name: "Маркетинг и реклама", type: "EXPENSE" },
    }),
    prisma.category.create({
      data: { organizationId: org.id, name: "Офисные расходы", type: "EXPENSE", isSystem: true },
    }),
    prisma.category.create({
      data: { organizationId: org.id, name: "Налоги", type: "EXPENSE", isSystem: true },
    }),
    prisma.category.create({
      data: { organizationId: org.id, name: "Банковские услуги", type: "EXPENSE", isSystem: true },
    }),
    prisma.category.create({
      data: { organizationId: org.id, name: "Транспорт", type: "EXPENSE" },
    }),
    prisma.category.create({
      data: { organizationId: org.id, name: "Связь и интернет", type: "EXPENSE" },
    }),
  ]);

  console.log("✅ Категории созданы:", incomeCategories.length + expenseCategories.length);

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      organizationId: org.id,
      name: "Разработка сайта клиента",
      status: "ACTIVE",
      budget: 2000000,
      color: "#1A56DB",
    },
  });

  const project2 = await prisma.project.create({
    data: {
      organizationId: org.id,
      name: "Маркетинговая кампания Q1",
      status: "COMPLETED",
      budget: 500000,
      color: "#0E9F6E",
    },
  });

  console.log("✅ Проекты созданы: 2 проекта");

  // Create counterparties
  const counterparties = await Promise.all([
    prisma.counterparty.create({
      data: {
        organizationId: org.id,
        name: "ТОО «АйТи Казахстан»",
        type: "CLIENT",
        email: "info@itkazakhstan.kz",
      },
    }),
    prisma.counterparty.create({
      data: {
        organizationId: org.id,
        name: "ИП Смаков",
        type: "SUPPLIER",
      },
    }),
    prisma.counterparty.create({
      data: {
        organizationId: org.id,
        name: "БЦ Алматы Тауэр",
        type: "SUPPLIER",
      },
    }),
  ]);

  console.log("✅ Контрагенты созданы:", counterparties.length);

  // Create 50 transactions over last 3 months
  const accounts = [mainAccount, cashAccount, cardAccount];
  const transactions = [];

  // Regular salary payments (last 3 months)
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    d.setDate(5);

    transactions.push({
      organizationId: org.id,
      accountId: mainAccount.id,
      type: "EXPENSE" as const,
      amount: 1800000,
      date: d,
      categoryId: expenseCategories[0]!.id, // Зарплата
      description: "Выплата зарплаты сотрудникам",
      tags: ["зарплата", "персонал"],
    });
  }

  // Regular rent (last 3 months)
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    d.setDate(1);

    transactions.push({
      organizationId: org.id,
      accountId: mainAccount.id,
      type: "EXPENSE" as const,
      amount: 350000,
      date: d,
      categoryId: expenseCategories[1]!.id, // Аренда
      counterpartyId: counterparties[2]!.id,
      description: "Аренда офиса",
      tags: ["аренда", "офис"],
    });
  }

  // Income transactions
  const incomeDescriptions = [
    { desc: "Оплата по договору №123", amount: [800000, 2500000] as [number, number] },
    { desc: "Консультационные услуги", amount: [200000, 800000] as [number, number] },
    { desc: "Реализация товаров", amount: [500000, 3000000] as [number, number] },
    { desc: "Предоплата за услуги", amount: [300000, 1000000] as [number, number] },
  ];

  for (let i = 0; i < 20; i++) {
    const item = pick(incomeDescriptions);
    transactions.push({
      organizationId: org.id,
      accountId: pick([mainAccount, cashAccount]).id,
      type: "INCOME" as const,
      amount: randomAmount(item.amount[0], item.amount[1]),
      date: randomDate(90),
      categoryId: pick(incomeCategories).id,
      counterpartyId: Math.random() > 0.5 ? counterparties[0]!.id : null,
      projectId: Math.random() > 0.6 ? project1.id : null,
      description: item.desc,
      tags: [],
    });
  }

  // Expense transactions
  const expenseDescriptions = [
    { desc: "Реклама в социальных сетях", catIndex: 2, amount: [50000, 300000] as [number, number] },
    { desc: "Канцелярские товары", catIndex: 3, amount: [5000, 50000] as [number, number] },
    { desc: "Налоговые отчисления", catIndex: 4, amount: [100000, 500000] as [number, number] },
    { desc: "Обслуживание банковского счёта", catIndex: 5, amount: [5000, 20000] as [number, number] },
    { desc: "Корпоративный транспорт", catIndex: 6, amount: [20000, 100000] as [number, number] },
    { desc: "Телефония и интернет", catIndex: 7, amount: [15000, 60000] as [number, number] },
    { desc: "Хозяйственные нужды", catIndex: 3, amount: [10000, 80000] as [number, number] },
  ];

  for (let i = 0; i < 20; i++) {
    const item = pick(expenseDescriptions);
    transactions.push({
      organizationId: org.id,
      accountId: pick(accounts).id,
      type: "EXPENSE" as const,
      amount: randomAmount(item.amount[0], item.amount[1]),
      date: randomDate(90),
      categoryId: expenseCategories[item.catIndex]!.id,
      projectId: Math.random() > 0.7 ? project2.id : null,
      description: item.desc,
      tags: [],
    });
  }

  // Create all transactions
  await prisma.transaction.createMany({
    data: transactions.map((t) => ({
      ...t,
      currency: "KZT",
      isConfirmed: true,
      counterpartyId: undefined,
      projectId: undefined,
      // Use proper null handling
    })),
    skipDuplicates: true,
  });

  // Create individually to handle null fields
  for (const tx of transactions) {
    await prisma.transaction.create({
      data: {
        organizationId: tx.organizationId,
        accountId: tx.accountId,
        type: tx.type,
        amount: tx.amount,
        date: tx.date,
        categoryId: tx.categoryId ?? null,
        counterpartyId: "counterpartyId" in tx ? tx.counterpartyId ?? null : null,
        projectId: "projectId" in tx ? tx.projectId ?? null : null,
        description: tx.description ?? null,
        tags: tx.tags ?? [],
        currency: "KZT",
        isConfirmed: true,
      },
    }).catch(() => {
      // Skip if duplicate (from createMany above)
    });
  }

  console.log("✅ Транзакции созданы: 50 транзакций");

  // Create budgets
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  await prisma.budget.createMany({
    data: [
      { organizationId: org.id, categoryId: expenseCategories[0]!.id, period, plannedAmount: 2000000 },
      { organizationId: org.id, categoryId: expenseCategories[1]!.id, period, plannedAmount: 350000 },
      { organizationId: org.id, categoryId: expenseCategories[2]!.id, period, plannedAmount: 500000 },
      { organizationId: org.id, categoryId: expenseCategories[3]!.id, period, plannedAmount: 100000 },
    ],
  });

  console.log("✅ Бюджеты созданы");

  console.log("\n🎉 Сидирование завершено!");
  console.log("\n📊 Тестовые данные:");
  console.log("   Организация: ТОО «Ромашка и Партнёры»");
  console.log("   Email владельца: owner@romashka.kz");
  console.log("   Email бухгалтера: accountant@romashka.kz");
  console.log("   Пароль: password123");
}

main()
  .catch((e) => {
    console.error("❌ Ошибка сидирования:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
