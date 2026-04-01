"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  children?: Category[];
}

interface Transaction {
  id: string;
  type: string;
  category: { id: string; name: string } | null;
}

interface Props {
  transaction: Transaction;
  categories: Category[];
  onUpdate: (categoryId: string | null) => void;
}

export function InlineCategorySelect({ transaction, categories, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (categoryId: string | null) => {
    setLoading(true);
    setOpen(false);
    try {
      await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId }),
      });
      onUpdate(categoryId);
    } finally {
      setLoading(false);
    }
  };

  // Group categories: top-level with their children
  const incomeFilter = transaction.type === "INCOME";
  const topLevel = categories.filter(
    (c) =>
      c.parentId === null &&
      (incomeFilter ? c.type === "INCOME" : c.type !== "INCOME")
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-all",
            "hover:ring-2 hover:ring-primary/50 focus:outline-none cursor-pointer",
            transaction.category
              ? "bg-blue-50 text-blue-700"
              : "bg-gray-100 text-gray-500 border border-dashed border-gray-300"
          )}
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            transaction.category?.name ?? "+ Категория"
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        <Command>
          <CommandInput placeholder="Найти категорию..." />
          <CommandList>
            <CommandEmpty>Категории не найдены</CommandEmpty>
            {/* Clear option */}
            {transaction.category && (
              <CommandGroup>
                <CommandItem
                  onSelect={() => handleSelect(null)}
                  className="text-gray-500"
                >
                  Убрать категорию
                </CommandItem>
              </CommandGroup>
            )}
            {topLevel.map((parent) => {
              const children = categories.filter((c) => c.parentId === parent.id);
              if (children.length > 0) {
                return (
                  <CommandGroup key={parent.id} heading={parent.name}>
                    {children.map((child) => (
                      <CommandItem
                        key={child.id}
                        value={child.name}
                        onSelect={() => handleSelect(child.id)}
                      >
                        {child.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              }
              return (
                <CommandGroup key={parent.id}>
                  <CommandItem
                    value={parent.name}
                    onSelect={() => handleSelect(parent.id)}
                  >
                    {parent.name}
                  </CommandItem>
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
