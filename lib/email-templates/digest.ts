export interface DigestData {
  orgName:      string;
  period:       string; // e.g. "31 марта — 6 апреля 2026"
  totalIncome:  number;
  totalExpense: number;
  netCashflow:  number;
  cashBalance:  number;
  topExpenses:  { name: string; amount: number }[];
  overdueCount: number;
  overdueAmount: number;
}

export function generateDigestHtml(data: DigestData): string {
  const fmt = (n: number) =>
    n.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " ₸";

  const netColor = data.netCashflow >= 0 ? "#0E9F6E" : "#E02424";

  const topExpensesRows = data.topExpenses
    .map(
      (e) => `
      <tr>
        <td style="padding:6px 0;color:#374151;font-size:14px;">${e.name}</td>
        <td style="padding:6px 0;text-align:right;color:#374151;font-size:14px;">${fmt(e.amount)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#1A56DB;border-radius:12px 12px 0 0;padding:24px 32px;">
              <p style="margin:0;color:#fff;font-size:12px;opacity:.7;text-transform:uppercase;letter-spacing:.05em;">Финансовый дайджест</p>
              <h1 style="margin:4px 0 0;color:#fff;font-size:22px;font-weight:700;">${data.orgName}</h1>
              <p style="margin:4px 0 0;color:#fff;opacity:.7;font-size:13px;">${data.period}</p>
            </td>
          </tr>

          <!-- KPI row -->
          <tr>
            <td style="background:#fff;padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="text-align:center;padding:12px 8px;background:#F0FDF4;border-radius:8px;">
                    <p style="margin:0;font-size:11px;color:#6B7280;">Доходы</p>
                    <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#0E9F6E;">${fmt(data.totalIncome)}</p>
                  </td>
                  <td width="4%"></td>
                  <td width="33%" style="text-align:center;padding:12px 8px;background:#FFF5F5;border-radius:8px;">
                    <p style="margin:0;font-size:11px;color:#6B7280;">Расходы</p>
                    <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#E02424;">${fmt(data.totalExpense)}</p>
                  </td>
                  <td width="4%"></td>
                  <td width="33%" style="text-align:center;padding:12px 8px;background:#F0F9FF;border-radius:8px;">
                    <p style="margin:0;font-size:11px;color:#6B7280;">Чистый поток</p>
                    <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:${netColor};">${fmt(data.netCashflow)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cash balance -->
          <tr>
            <td style="background:#fff;padding:0 32px 24px;">
              <div style="background:#F9FAFB;border-radius:8px;padding:14px 18px;display:flex;justify-content:space-between;">
                <span style="color:#374151;font-size:14px;">Остаток денежных средств</span>
                <span style="color:#111827;font-size:14px;font-weight:700;">${fmt(data.cashBalance)}</span>
              </div>
            </td>
          </tr>

          ${data.topExpenses.length > 0 ? `
          <!-- Top expenses -->
          <tr>
            <td style="background:#fff;padding:0 32px 24px;">
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#111827;">Топ расходов за неделю</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${topExpensesRows}
              </table>
            </td>
          </tr>` : ""}

          ${data.overdueCount > 0 ? `
          <!-- Overdue alert -->
          <tr>
            <td style="background:#fff;padding:0 32px 24px;">
              <div style="background:#FFF5F5;border:1px solid #FCA5A5;border-radius:8px;padding:14px 18px;">
                <p style="margin:0;font-size:14px;color:#E02424;">
                  ⚠️ <strong>${data.overdueCount} просроченных</strong> задолженностей на сумму ${fmt(data.overdueAmount)}
                </p>
              </div>
            </td>
          </tr>` : ""}

          <!-- Footer -->
          <tr>
            <td style="background:#F3F4F6;border-radius:0 0 12px 12px;padding:18px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;">
                Этот дайджест формируется автоматически каждый понедельник.<br/>
                Изменить настройки можно в <a href="#" style="color:#1A56DB;">Уведомлениях</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
