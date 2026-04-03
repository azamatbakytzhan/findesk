import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategoriesClient } from "./categories-client";

export default async function CategoriesSettingsPage() {
  const session = await auth();
  if (!session) return null;

  const categories = await prisma.category.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  });

  return <CategoriesClient initialCategories={categories} />;
}
