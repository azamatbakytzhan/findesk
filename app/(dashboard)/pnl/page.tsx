import { auth } from "@/lib/auth";
import { PnlClient } from "./pnl-client";

export default async function PnlPage() {
  const session = await auth();
  if (!session) return null;
  return <PnlClient />;
}
