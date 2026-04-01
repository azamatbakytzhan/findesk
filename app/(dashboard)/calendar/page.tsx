import { auth } from "@/lib/auth";
import { CalendarClient } from "./calendar-client";

export default async function CalendarPage() {
  const session = await auth();
  if (!session) return null;
  return <CalendarClient />;
}
