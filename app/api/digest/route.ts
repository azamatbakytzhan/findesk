import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateDigest, sendDigestEmail } from "@/lib/digest";
import { generateDigestHtml } from "@/lib/email-templates/digest";

// Preview endpoint — returns rendered HTML
export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await generateDigest(session.user.organizationId);
    const html = generateDigestHtml(data);

    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (err) {
    console.error("GET /api/digest:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

// Manual trigger (for test button in notifications settings)
export async function POST() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sent = await sendDigestEmail(session.user.organizationId);
    return NextResponse.json({ sent });
  } catch (err) {
    console.error("POST /api/digest:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
