import { auth } from "@/lib/auth";
import { BillingClient } from "./billing-client";

export default async function BillingPage() {
  const session = await auth();
  if (!session) return null;
  return <BillingClient />;
}
