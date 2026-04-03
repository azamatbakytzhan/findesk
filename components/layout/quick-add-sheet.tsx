"use client";

import { useState, useEffect, useCallback } from "react";
import { TransactionForm } from "@/components/transactions/transaction-form";

interface Account { id: string; name: string; balance: number }
interface Category { id: string; name: string; type: string; parentId: string | null }
interface Project { id: string; name: string }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickAddSheet({ open, onOpenChange }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchData = useCallback(async () => {
    const [accsRes, catsRes, projsRes] = await Promise.all([
      fetch("/api/accounts"),
      fetch("/api/categories"),
      fetch("/api/projects"),
    ]);
    if (accsRes.ok) setAccounts(await accsRes.json().then((d) => d.accounts ?? d));
    if (catsRes.ok) setCategories(await catsRes.json().then((d) => d.categories ?? d));
    if (projsRes.ok) setProjects(await projsRes.json().then((d) => d.projects ?? d));
  }, []);

  useEffect(() => {
    if (open) void fetchData();
  }, [open, fetchData]);

  return (
    <TransactionForm
      open={open}
      onOpenChange={onOpenChange}
      accounts={accounts}
      categories={categories}
      projects={projects}
      onSuccess={() => onOpenChange(false)}
    />
  );
}
