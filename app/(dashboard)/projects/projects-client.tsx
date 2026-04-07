"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Plus, FolderOpen, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  budget: number | null;
  color: string | null;
  _count: { transactions: number };
}

const statusLabels: Record<string, string> = {
  ACTIVE: "Активный",
  COMPLETED: "Завершён",
  ARCHIVED: "Архив",
};

const COLOR_SWATCHES = [
  "#1A56DB",
  "#0E9F6E",
  "#FF8C00",
  "#E74694",
  "#9061F9",
  "#C27803",
];

const defaultForm = {
  name: "",
  budget: "",
  color: "#1A56DB",
  status: "ACTIVE" as "ACTIVE" | "COMPLETED" | "ARCHIVED",
};

export function ProjectsClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      setProjects(data);
    } catch {
      toast.error("Не удалось загрузить проекты");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  function openCreate() {
    setEditingProject(null);
    setForm(defaultForm);
    setSheetOpen(true);
  }

  function openEdit(project: Project) {
    setEditingProject(project);
    setForm({
      name: project.name,
      budget: project.budget != null ? String(project.budget) : "",
      color: project.color ?? "#1A56DB",
      status: project.status,
    });
    setSheetOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Введите название проекта");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name:   form.name.trim(),
        color:  form.color,
        status: form.status,
        budget: form.budget ? parseFloat(form.budget) : undefined,
      };

      const isEdit = editingProject !== null;
      const url = isEdit ? `/api/projects/${editingProject.id}` : "/api/projects";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Ошибка сервера");
      }

      toast.success(isEdit ? "Проект обновлён" : "Проект создан");
      setSheetOpen(false);
      await fetchProjects();
    } catch (error) {
      toast.error(err instanceof Error ? err.message : "Ошибка сервера");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(project: Project) {
    const confirmed = window.confirm(
      `Удалить проект «${project.name}»? Это действие нельзя отменить.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Ошибка сервера");
      }
      toast.success("Проект удалён");
      await fetchProjects();
    } catch (error) {
      toast.error(err instanceof Error ? err.message : "Ошибка удаления");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Проекты</h1>
          <p className="text-sm text-gray-500 mt-1">Учёт финансов по проектам</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Создать проект
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="animate-pulse space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-gray-100" />
                    <div className="h-5 w-16 rounded bg-gray-100" />
                  </div>
                  <div className="h-4 w-32 rounded bg-gray-100" />
                  <div className="h-3 w-24 rounded bg-gray-100" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Нет проектов</p>
            <p className="text-sm text-gray-400 mt-1">Создайте проект для детального учёта</p>
            <Button onClick={openCreate} className="mt-4 gap-2" variant="outline">
              <Plus className="w-4 h-4" />
              Создать проект
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="border-0 shadow-sm group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${project.color ?? "#1A56DB"}20` }}
                  >
                    <FolderOpen
                      className="w-5 h-5"
                      style={{ color: project.color ?? "#1A56DB" }}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant={
                        project.status === "ACTIVE"
                          ? "success"
                          : project.status === "COMPLETED"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {statusLabels[project.status] ?? project.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => openEdit(project)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(project)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-base font-semibold text-gray-900">{project.name}</p>
                {project.budget != null && (
                  <p className="text-sm text-gray-500 mt-1">
                    Бюджет: {formatCurrency(Number(project.budget))}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {project._count.transactions} транзакций
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sheet: Create / Edit */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>
              {editingProject ? "Редактировать проект" : "Новый проект"}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="project-name">
                Название <span className="text-red-500">*</span>
              </Label>
              <Input
                id="project-name"
                placeholder="Название проекта"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label htmlFor="project-budget">Бюджет</Label>
              <Input
                id="project-budget"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as typeof form.status }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Активный</SelectItem>
                  <SelectItem value="COMPLETED">Завершён</SelectItem>
                  <SelectItem value="ARCHIVED">Архив</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Color picker */}
            <div className="space-y-2">
              <Label>Цвет</Label>
              <div className="flex gap-2">
                {COLOR_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: hex }))}
                    className="w-8 h-8 rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                    style={{
                      backgroundColor: hex,
                      borderColor: form.color === hex ? "#111827" : "transparent",
                      transform: form.color === hex ? "scale(1.15)" : "scale(1)",
                    }}
                    aria-label={hex}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setSheetOpen(false)}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting
                  ? "Сохранение..."
                  : editingProject
                  ? "Сохранить"
                  : "Создать"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
