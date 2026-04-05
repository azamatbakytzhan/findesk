export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import ExcelJS from "exceljs";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch data from the cashflow report API
    const { searchParams } = new URL(req.url);
    const dataUrl = new URL("/api/reports/cashflow", req.url);
    if (searchParams.get("dateFrom")) dataUrl.searchParams.set("dateFrom", searchParams.get("dateFrom")!);
    if (searchParams.get("dateTo"))   dataUrl.searchParams.set("dateTo",   searchParams.get("dateTo")!);
    if (searchParams.get("accountId")) dataUrl.searchParams.set("accountId", searchParams.get("accountId")!);

    const dataRes = await fetch(dataUrl.toString(), {
      headers: { cookie: req.headers.get("cookie") ?? "" },
    });
    const { months, rows, summary } = await dataRes.json() as {
      months: string[];
      rows: Array<{ id: string; name: string; isGroup: boolean; type: string; indent: number; values: number[]; total: number }>;
      summary: { income: number[]; expense: number[]; netFlow: number[] };
    };

    const wb    = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("ДДС");

    const orgName = session.user.orgName;

    // Title row
    sheet.mergeCells(1, 1, 1, months.length + 2);
    const titleCell = sheet.getCell("A1");
    titleCell.value = `Отчёт ДДС — ${orgName}`;
    titleCell.font  = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: "center" };

    // Header row
    const headerRow = sheet.getRow(2);
    headerRow.getCell(1).value = "Статья";
    months.forEach((m, i) => { headerRow.getCell(i + 2).value = m; });
    headerRow.getCell(months.length + 2).value = "ИТОГО";
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2EFDA" } };
      cell.alignment = { horizontal: "center" };
    });

    // Data rows
    let rowIdx = 3;
    for (const row of rows) {
      const exRow = sheet.getRow(rowIdx++);
      const indent = "  ".repeat(row.indent);
      exRow.getCell(1).value = indent + row.name;

      if (row.isGroup) {
        exRow.eachCell((cell) => {
          cell.font = { bold: true };
          cell.fill = {
            type: "pattern", pattern: "solid",
            fgColor: { argb: row.type === "INCOME" ? "FFE8F5E9" : "FFFCE4EC" },
          };
        });
      }

      row.values.forEach((v, i) => {
        const cell = exRow.getCell(i + 2);
        cell.value  = v;
        cell.numFmt = "#,##0";
        if (v < 0) cell.font = { color: { argb: "FFE02424" } };
      });
      const totalCell = exRow.getCell(months.length + 2);
      totalCell.value  = row.total;
      totalCell.numFmt = "#,##0";
      if (row.isGroup) totalCell.font = { bold: true };
    }

    // Net flow row
    const nfRow = sheet.getRow(rowIdx);
    nfRow.getCell(1).value = "ЧИСТЫЙ ПОТОК";
    summary.netFlow.forEach((v, i) => {
      const cell = nfRow.getCell(i + 2);
      cell.value  = v;
      cell.numFmt = "#,##0";
      cell.font   = { bold: true, color: { argb: v >= 0 ? "FF0E9F6E" : "FFE02424" } };
    });
    const nfTotal = summary.netFlow.reduce((s, v) => s + v, 0);
    const nfTotalCell = nfRow.getCell(months.length + 2);
    nfTotalCell.value  = nfTotal;
    nfTotalCell.numFmt = "#,##0";
    nfTotalCell.font   = { bold: true, color: { argb: nfTotal >= 0 ? "FF0E9F6E" : "FFE02424" } };
    nfRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F4FF" } };
    });

    // Column widths
    sheet.getColumn(1).width = 32;
    for (let i = 2; i <= months.length + 2; i++) {
      sheet.getColumn(i).width = 14;
    }

    const buffer = await wb.xlsx.writeBuffer();
    const now    = new Date();
    const fname  = `cashflow-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.xlsx`;

    return new Response(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fname}"`,
      },
    });
  } catch (error) {
    console.error("GET /api/reports/cashflow/export:", error);
    return NextResponse.json({ error: "Ошибка экспорта" }, { status: 500 });
  }
}
