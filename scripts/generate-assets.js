#!/usr/bin/env node
/**
 * Generates static image assets for Findesk:
 *   - public/og-image.png        (1200 × 630)  — OpenGraph / Twitter card
 *   - public/screenshots/dashboard.png (1200 × 700) — App screenshot placeholder
 *
 * Usage: node scripts/generate-assets.js
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const PUBLIC = path.join(__dirname, "..", "public");
const SCREENSHOTS = path.join(PUBLIC, "screenshots");

fs.mkdirSync(SCREENSHOTS, { recursive: true });

// Brand colours
const BG_BLUE = { r: 26, g: 86, b: 219 };       // #1A56DB
const BG_DARK = { r: 15, g: 23, b: 42 };          // #0F172A
const WHITE   = { r: 255, g: 255, b: 255 };

/** Renders an SVG string to a PNG Buffer via sharp */
async function svgToPng(svgString, width, height) {
  return sharp(Buffer.from(svgString))
    .resize(width, height)
    .png()
    .toBuffer();
}

// ── OG Image (1200 × 630) ──────────────────────────────────────────────────
const ogSvg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E3A5F"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Accent bar -->
  <rect x="0" y="0" width="8" height="630" fill="#1A56DB"/>

  <!-- Logo circle -->
  <circle cx="140" cy="200" r="56" fill="#1A56DB" opacity="0.15"/>
  <circle cx="140" cy="200" r="40" fill="#1A56DB"/>
  <text x="140" y="210" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="28" font-weight="bold" fill="white">F</text>

  <!-- Title -->
  <text x="220" y="185" font-family="Arial, sans-serif" font-size="64"
        font-weight="bold" fill="white">Findesk</text>
  <text x="220" y="225" font-family="Arial, sans-serif" font-size="24"
        fill="#94A3B8">Финансовый учёт с ИИ-агентом</text>

  <!-- Divider -->
  <rect x="120" y="280" width="960" height="1" fill="#334155"/>

  <!-- Feature pills -->
  <rect x="120" y="310" width="180" height="44" rx="22" fill="#1A56DB" opacity="0.2"/>
  <text x="210" y="338" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="18" fill="#93C5FD">ДДС</text>

  <rect x="318" y="310" width="180" height="44" rx="22" fill="#1A56DB" opacity="0.2"/>
  <text x="408" y="338" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="18" fill="#93C5FD">ОПиУ</text>

  <rect x="516" y="310" width="200" height="44" rx="22" fill="#1A56DB" opacity="0.2"/>
  <text x="616" y="338" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="18" fill="#93C5FD">Баланс</text>

  <rect x="734" y="310" width="240" height="44" rx="22" fill="#0E9F6E" opacity="0.2"/>
  <text x="854" y="338" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="18" fill="#6EE7B7">ИИ-ассистент</text>

  <!-- Tagline -->
  <text x="600" y="450" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="30" fill="#CBD5E1">
    Управленческий учёт для малого бизнеса Казахстана
  </text>

  <!-- URL -->
  <text x="600" y="580" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="20" fill="#475569">findesk.kz</text>
</svg>
`;

// ── Dashboard screenshot placeholder (1200 × 700) ─────────────────────────
const dashSvg = `
<svg width="1200" height="700" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1200" height="700" fill="#F8FAFC"/>

  <!-- Sidebar -->
  <rect width="220" height="700" fill="#0F172A"/>
  <text x="110" y="50" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="20" font-weight="bold" fill="white">Findesk</text>

  <!-- Sidebar items -->
  ${["Дашборд", "Транзакции", "ДДС", "ОПиУ", "Баланс", "Проекты", "Бюджеты", "ИИ-агент"]
    .map((item, i) => `
  <rect x="12" y="${85 + i * 46}" width="196" height="38" rx="8"
        fill="${i === 0 ? "#1A56DB" : "transparent"}"/>
  <text x="44" y="${110 + i * 46}" font-family="Arial, sans-serif"
        font-size="14" fill="${i === 0 ? "white" : "#94A3B8"}">${item}</text>
  `).join("")}

  <!-- Header -->
  <rect x="220" y="0" width="980" height="60" fill="white"
        stroke="#E2E8F0" stroke-width="1"/>
  <text x="860" y="38" font-family="Arial, sans-serif" font-size="14"
        fill="#1A56DB" font-weight="bold">+ Добавить  ⌘K</text>

  <!-- KPI cards -->
  ${[
    { label: "Доходы", value: "2 450 000 ₸", color: "#0E9F6E" },
    { label: "Расходы", value: "1 230 000 ₸", color: "#E3342F" },
    { label: "Прибыль", value: "1 220 000 ₸", color: "#1A56DB" },
    { label: "Баланс", value: "5 800 000 ₸", color: "#9061F9" },
  ].map((kpi, i) => `
  <rect x="${240 + i * 235}" y="80" width="215" height="100" rx="12"
        fill="white" stroke="#E2E8F0" stroke-width="1"/>
  <text x="${248 + i * 235}" y="110" font-family="Arial, sans-serif"
        font-size="13" fill="#64748B">${kpi.label}</text>
  <text x="${248 + i * 235}" y="148" font-family="Arial, sans-serif"
        font-size="22" font-weight="bold" fill="${kpi.color}">${kpi.value}</text>
  `).join("")}

  <!-- Chart placeholder -->
  <rect x="240" y="200" width="580" height="280" rx="12"
        fill="white" stroke="#E2E8F0" stroke-width="1"/>
  <text x="530" y="340" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="16" fill="#94A3B8">График движения денег</text>

  <!-- Transaction list placeholder -->
  <rect x="840" y="200" width="340" height="280" rx="12"
        fill="white" stroke="#E2E8F0" stroke-width="1"/>
  <text x="1010" y="230" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="14" font-weight="bold" fill="#0F172A">Последние транзакции</text>
  ${[0, 1, 2, 3, 4].map(i => `
  <rect x="856" y="${248 + i * 44}" width="308" height="36" rx="6" fill="#F8FAFC"/>
  `).join("")}

  <!-- Bottom bar -->
  <rect x="220" y="510" width="980" height="60" fill="white"
        stroke="#E2E8F0" stroke-width="1"/>
  <text x="600" y="547" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="13" fill="#94A3B8">Findesk — скриншот дашборда</text>
</svg>
`;

async function main() {
  console.log("Generating OG image (1200×630)…");
  const ogBuf = await svgToPng(ogSvg, 1200, 630);
  fs.writeFileSync(path.join(PUBLIC, "og-image.png"), ogBuf);
  console.log("  ✓ public/og-image.png");

  console.log("Generating dashboard screenshot (1200×700)…");
  const dashBuf = await svgToPng(dashSvg, 1200, 700);
  fs.writeFileSync(path.join(SCREENSHOTS, "dashboard.png"), dashBuf);
  console.log("  ✓ public/screenshots/dashboard.png");

  console.log("Done.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
